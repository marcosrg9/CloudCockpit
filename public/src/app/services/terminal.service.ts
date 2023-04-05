import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// Servicios, modelos y controladores de eventos.
import { WebsocketsService } from './websockets.service';
import { Terminal } from '../models/terminal.model';
import { SeqParser } from '../models/sequenceParser.model';
import { TerminalEventsController } from '../events/terminal.events';

// Interfaces.
import { ConnectedWebTerminal, ConnectingWebTerminal, isConnectedWebTerm, minimalIdentification, WaitingWebTerminal, WebTerminal, WebTerminalStore } from '../interfaces/pty.interface';
import { resizeEvent } from '../../../../src/interfaces/connection.interface';

// Librerías
import { IDisposable } from 'xterm';
import { stores } from '../data/store.data';
import { terminalStore } from '../data/terminal.store';
import { ConnectingSshSession, connectionError, openConnection, writeEvent } from '../../../../src/interfaces/unifiedStructure.interface';
import { sizeParams } from '../../../../src/models/ssh.model';
import { PlatformService } from './platform.service';

@Injectable({ providedIn: 'root' })
export class TerminalService implements OnDestroy {

	/** Conexiones abiertas. */
	public store = terminalStore;

	/** Almacena los errores de conexión. */
	public connectionErrors: connectionError[] = [];

	/** Propiedad que indica si hay una conexión pendiente de apertura. */
	public pending: WaitingWebTerminal[] = [];

	private keyListeners: IDisposable[] = [];

	private keyListener: IDisposable | undefined;

	private eventController: TerminalEventsController;

	private _lastSizeParams: sizeParams | undefined;

	constructor(private socket: WebsocketsService,
				private platform: PlatformService,
				public router: Router) {
		
		// Instancia el controlador de eventos de terminales.
		this.eventController = new TerminalEventsController(this, this.socket);
		this.onResizeWindow();
		
	}

	private onResizeWindow() {
		new ResizeObserver(() => {
			this._lastSizeParams = undefined;
		}).observe(document.body)
	}
	
	public discover() {
		if (!this.eventController) this.eventController = new TerminalEventsController(this, this.socket);
		this.socket.emitWhenReady('getTerminals');
	}

	/**
	 * Prepara una nueva conexión para abrir una terminal.
	 * @param server Identificador del servidor.
	 * @param auth Indentificador de credenciales para el servidor dado.
	 */
	public prepareTerminal(server: string, auth: minimalIdentification['auth']): Promise<void> {

		return new Promise((resolve, reject) => {
	
			const prepareErrorHandler = () => {
				this.socket.removeListener('preparedTerminal', preparedHandler);
				this.socket.removeListener('prepareTerminalError', prepareErrorHandler);
				return reject();
			}
	
			const preparedHandler = (data: ConnectingSshSession) => {
				if( data.host === server) {

					let authsMatchs = false;

					// Refatorizar esto.
					//(!(typeof data.auth === 'object' && data.auth.username === data.auth.username &&
					//			data.auth.password === data.auth.password) ||
					// !(typeof data.auth === 'string' && data.auth === auth))
					if ((typeof data.auth === 'object' &&
						data.auth.username === data.auth.username &&
						data.auth.password === data.auth.password)) {
						authsMatchs = true;
					} else if (typeof data.auth === 'string' && data.auth === auth) authsMatchs = true
					else return;

					const term: ConnectingWebTerminal = { connection: data }
					this.store.set(term.connection.pid, term);

					this.socket.removeListener('preparedTerminal', preparedHandler);
					this.socket.removeListener('prepareTerminalError', prepareErrorHandler);

					// Resuelve la promesa si no hay parámetros de dimensiones.
					if (!this.lastSizeParams) return resolve();

					// En caso contrario inicia la conexión.
					this.socket.emit('newTerminal', { pid: data.pid, size: this.lastSizeParams } as openConnection);

					this.socket.removeListener('preparedTerminal', preparedHandler);
					this.socket.removeListener('prepareTerminalError', prepareErrorHandler);

					return resolve();
				}
			}

			this.socket.once('preparedTerminal', preparedHandler);
			this.socket.once('prepareTerminalError', prepareErrorHandler);
			this.socket.emit('prepareTerminal', { host: server, auth } as minimalIdentification);

		})

		
	}

	/**
	 * Adjunta un contenedor a una terminal sin instanciar y emite una petición de conexión.
	 * @param pid Identificador de terminal.
	 * @param element Elemento HTML.
	 */
	public attachAndConnect(pid: string, element: HTMLDivElement) {

		const partialTerm = this.findTerminal(pid) as ConnectedWebTerminal;

		if (!partialTerm) return;

		// Crea una nueva instancia de la terminal.
		const terminal = new Terminal();

		// Vincula la terminal al elemento contenedor.
		terminal.open(element);

		// Ajusta la terminal.
		terminal.fitAddon.fit();
		
		if (this.keyListener) this.keyListener.dispose();

		this.keyListener = terminal?.onKey(({domEvent}) => {this.write(domEvent)});

		// Asigna la terminal.
		partialTerm.terminal = terminal;

		// Asigna el contenedor.
		partialTerm.element = element;

		setTimeout(() => {

		// Prepara los parámetros de dimensiones.
		const size = {
			cols: terminal.cols.toString(),
			rows: terminal.rows.toString(),
			width: element.clientWidth.toString(),
			height: element.clientHeight.toString()
		}

		// Asigna las dimensiones obtenidas al objeto de últimas dimensiones.
		this._lastSizeParams = size;

		this.socket.emit('newTerminal', { pid, size } as openConnection)

		}, 1000)


	}

	/**
	 * Mata una terminal enviando el evento de desconexión.
	 * @param pid Identificador de proceso.
	 */
	public disconnect(pid: string) {

		// Emite el evento de desconexión.
		this.socket.emit('killTerminal', { pid });

		// El método onDisconnect se lanza cuando el servidor responde.

	}


	/**
	 * Escribe datos en la terminal (en el servidor, no en la instancia).
	 * @param data Cadena a introducir en la terminal.
	 */
	public write(data: KeyboardEvent) {
		
		// Parsea la entrada.
		const input = SeqParser.parse(data);

		// Busca la terminal que tiene el foco.
		const term = this.getFocusedPty();

		// Comprueba si ha encontrado la terminal.
		if (term) {

			if (term.connection.status === 'connected' && term.connection.pid) {

				// Desestructura las propiedades requeridas.
				const { auth, host, pid } = term.connection;

				// Emite el evento con los datos.
				this.socket.emit('writeToTerm', { pid, data: input } as writeEvent);

			}


		}

	}

	/**
	 * Pone el foco en una terminal.
	 * @param pid Identificador de proceso.
	 */
	public focus(pid: string) {

		// Busca la terminal correspondiente a los datos.
		const term = this.findTerminal(pid);

		// Comprueba que la terminal exista.
		if (term && !term.focus) {

			if (this.keyListener) this.keyListener.dispose();

			this.keyListener = term.terminal?.onKey(({domEvent}) => {this.write(domEvent)});

			// Quita el foco a todas las terminales.
			this.blurAll();

			// Activa el foco a la terminal seleccionada.
			term.focus = true;

		}

	}

	/**
	 * Quita el foco a todas las terminales.
	 */
	private blurAll() {

		// Recorre el array y establece por cada terminal la propiedad de foco en falso.
		this.store.forEach(term => term.focus = false);

	}

	/**
	 * Ajusta el tamaño de la terminal y obtiene parámetros para enviarlos al servidor.
	 */
	public resize() {

		const term = this.getFocusedPty() as ConnectedWebTerminal;

		if (term) {

			term.terminal?.fitAddon.fit();

			setTimeout(() => {

				term.terminal?.fitAddon.fit();
				const { cols, rows, element } = term.terminal!;
				const { clientWidth: width, clientHeight: height } = element!;
				const size = { cols: cols.toString(), rows: rows.toString(), width: width.toString(), height: height.toString() };

				this._lastSizeParams = size;

				this.socket.emit('resize', {
					auth: term.connection.auth,
					host: term.connection.host,
					pid: term.connection.pid,
					size: this.lastSizeParams
				} as resizeEvent);

			}, 200)

		}

		return;

	}

	/**
	 * Filtra las terminales con el identificador del servidor indicado.
	 * @param host Identificador del servidor.
	 */
	public filterPtysByServer(host: string): WebTerminal[] {
		return this.store.filterTerminalByServer(host);
	}

	/**
	 * Busca la terminal que tenga el foco.
	 */
	public getFocusedPty() {
		return terminalStore.reflectedTerminalStoreArray.find((t => t.focus));
	}

	/**
	 * Indica si una terminal dada tiene el foco.
	 * @param term Terminal
	 */
	public haveFocus(term: WebTerminal) {
		
		if (term.focus) return true
		
		return false

	}

	/**
	 * Reenlaza una terminal existente con el contenedor correspondiente.
	 * Nota: no abre la conexión.
	 * @param host Identificador del servidor.
	 * @param pid Identificador de proceso.
	 * @param element Contenedor HTML.
	 */
	public bindTerminal(host: string, auth: string, pid: string, element: HTMLDivElement) {

		// Busca la terminal correspondiente.
		const term = this.findTerminal(pid) as ConnectedWebTerminal;

		// Comprueba que la terminal se ha encontrado.
		if (term) {

			// Vincula el elemento.
			term.element = element;

			// Comprueba si no hay una instancia de terminal.
			if (!term.terminal) {

				// Instancia la terminal.
				term.terminal = new Terminal();

				// Abre la terminal en el contenedor.
				term.terminal.open(element);

				// Escucha los eventos del prompt.
				if (this.keyListener) this.keyListener.dispose();

				this.keyListener = term.terminal?.onKey(({domEvent}) => {this.write(domEvent)});
				
			// Abre la terminal en el elemento.
			} else term.terminal.open(element);

			term.terminal.fitAddon.fit();

			if (isConnectedWebTerm(term)) {
				setTimeout(() => {

					const { cols, rows, element } = term.terminal!;
					const { clientWidth: width, clientHeight: height } = element!;
					const size = { cols: cols.toString(), rows: rows.toString(), width: width.toString(), height: height.toString() };

					this._lastSizeParams = size;
	
					if (term.connection.history) {
						// Escribe en la terminal.
						term.terminal!.write(term.connection.history);
		
						// Elimina el historial.
						term.connection.history = '';
					}
	
				}, 200)
			}

		} else {
			alert('Terminal no encontrada. Información volcada en consola.');
			console.log({ host, auth, pid, element });
		}

	}

	/**
	 * Añade una conexión pendiente de inicialización.
	 * @param params Parámetros de conexión al servidor.
	 */
	public addPendingInit(params: minimalIdentification) {

		// TODO: reemplazar esto por el método prepareTerminal de esta clase.
		// @ts-ignore
		this.pending.push(params)
	}

	/**
	 * Elimina un error de conexión del array.
	 * @param error Objeto de error de conexión.
	 */
	public deleteError(error: connectionError) {
		// Elimina el error de conexión del array.
		this.connectionErrors.splice(this.connectionErrors.indexOf(error), 1);
	}

	public findTerminal(pid: minimalIdentification['pid']): WebTerminal | undefined {

		// Comprueba si el pid ha sido definido.
		if (!pid) return;

		return this.store.get(pid);

	}
	/**
	 * Limpia el almacén de terminales.
	 * Elimina las instancias de las ttys y los controladores eventos de pulsaciones.
	 */
	public cleanUp() {

		this.eventController.cleanUp();
		
		this.store.clear();

		this.eventController = undefined as any;

	}
	
	public removeWriteEvents() {

		this.keyListeners.forEach(a => a.dispose());
	}

	public get lastSizeParams(): sizeParams | undefined {
		return this._lastSizeParams;
	}

	ngOnDestroy(): void {
		console.log('Matando servicio de terminales...')
	}

}