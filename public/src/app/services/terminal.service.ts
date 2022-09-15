import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

// Servicios, modelos y controladores de eventos.
import { WebsocketsService } from './websockets.service';
import { Terminal } from '../models/terminal.model';
import { SeqParser } from '../models/sequenceParser.model';
import { TerminalEventsController } from '../events/terminal.events';

// Interfaces.
import { incommingConnection, inProgressConnection, successfulConnection, minimalIdentify } from '../interfaces/pty.interface';
import { connectionError } from '../../../../src/interfaces/connection.interface'
import { resizeEvent } from '../../../../src/interfaces/connection.interface';
import { IDisposable } from 'xterm';


/**
 * //BUG: Entrada doble en el prompt.
 * Las terminales se instancian y se vuelven a vincular.
 * La función attachAndConnect se lanza, y después por alguna ocasión reBindTerminal. 
 */

@Injectable({
  providedIn: 'root'
})
export class TerminalService {

	/** Conexiones abiertas. */
	public terms: (incommingConnection | inProgressConnection | successfulConnection)[] = [];

	/** Almacena los errores de conexión. */
	public connectionErrors: connectionError[] = [];

	/** Propiedad que indica si hay una conexión pendiente de apertura. */
	public pending: incommingConnection[] = [];

	private keyListeners: IDisposable[] = [];

	private eventController: TerminalEventsController;

	constructor(private socket: WebsocketsService,
				public router: Router) {
		
					
		this.eventController = new TerminalEventsController(this, this.socket);

		// @ts-ignore
		window.term = this;
		
		
	}
	
	public discover() {
		if (!this.eventController) this.eventController = new TerminalEventsController(this, this.socket);
		this.socket.emitWhenReady('getTerminals');
	}

	// TODO: Esto hay que revisarlo.
	/**
	 * Abre una nueva conexión.
	 * @param server Identificador del servidor.
	 * @param element Elemento HTML que va a contener la terminal.
	 */
	public connect(server: string, credentials: string, element: HTMLDivElement) {


	}

	/**
	 * Adjunta un contenedor a una terminal sin instanciar y emite una petición de conexión.
	 * @param host Identificador del servidor.
	 * @param auth Identificador de las credenciales.
	 * @param element Elemento HTML.
	 */
	public attachAndConnect(host: string, auth: string, element: HTMLDivElement) {

		const partialTerm = this.findTerminal({ host, auth }) as inProgressConnection;

		if (!partialTerm) return;

		// Crea una nueva instancia de la terminal.
		const terminal = new Terminal();

		// Vincula la terminal al elemento contenedor.
		terminal.open(element);

		// Ajusta la terminal.
		terminal.fitAddon.fit();

		// Establece el manejador de evento de escritura.
		this.keyListeners.push(terminal.onKey(({ domEvent }) => {
			this.write(domEvent)
		}));

		// Asigna la terminal.
		partialTerm.terminal = terminal;

		// Asigna el contenedor.
		partialTerm.element = element;

		// Prepara los parámetros de dimensiones.
		const size = {
			cols: terminal.cols,
			rows: terminal.rows,
			width: element.clientWidth,
			height: element.clientHeight
		}

		console.log('Abriendo nueva terminal')

		this.socket.emit('newTerminal', { host, auth, size })

	}

	/**
	 * Mata una terminal enviando el evento de desconexión.
	 * @param host Identificador del servidor.
	 * @param auth Identificador de credencialess.
	 * @param pid Identificador de proceso.
	 */
	public disconnect(host: string, auth: string, pid: string) {

		// Emite el evento de desconexión.
		this.socket.emit('killTerminal', {host, auth, pid});

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
		const term = this.getFocusedPty() as successfulConnection;

		// Comprueba si ha encontrado la terminal.
		if (term) {

			// Desestructura las propiedades requeridas.
			const { host, auth, pid } = term;

			// Emite el evento con los datos.
			this.socket.emit('writeToTerm', { host, auth, pid, data: input });

		}

	}

	/**
	 * Pone el foco en una terminal.
	 * @param host Identificador del servidor.
	 * @param auth Identificador del servidor.
	 * @param pid Identificador de proceso.
	 */
	public focus(host: string, auth: string, pid: string) {

		// Busca la terminal correspondiente a los datos.
		const term = this.findTerminal({ host, auth, pid }) as incommingConnection;

		// Comprueba que la terminal exista.
		if (term) {

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
		// Recorre el array y establece por cada terminal la propiedad foco en falso.
		this.terms.forEach(pty => {

			if ('focus' in pty) pty.focus = false;
			
		});
	}

	/**
	 * Ajusta el tamaño de la terminal y obtiene parámetros para enviarlos al servidor.
	 * @param terminal Terminal de la que obtener parámetros de dimensión.
	 */
	public resize(terminal?: Terminal) {

		const term = this.getFocusedPty() as successfulConnection;

		if (term && term.pid && term.terminal) {

			term.terminal.fitAddon.fit();
			
			// Espera un poco a que la terminal se haya ajustado al contenedor.
			// Cutre pero no hay otra forma más elegante.
			setTimeout(() => {
				
				term.terminal.fitAddon.fit();
				
				// Obtiene los parámetros de dimensiones.
				const { cols, rows, element } = term.terminal;
				const { clientWidth: width, clientHeight: height } = element as HTMLDivElement;
		
				// Emite el evento de redimensionado.
				this.socket.emit('resize', {
					auth: term.auth,
					host: term.host,
					pid: term.pid,
					size: {
						cols: cols.toString(),
						rows: rows.toString(),
						width: width.toString(),
						height: height.toString()
					}
				} as resizeEvent);

			}, 200);

		}

		return;

	}

	/**
	 * Filtra las terminales con el identificador del servidor indicado.
	 * @param host Identificador del servidor.
	 */
	public filterPtysByServer(host: string) { return this.terms.filter(t => t.host === host); }

	/**
	 * Busca la terminal que tenga el foco.
	 */
	public getFocusedPty() { return this.terms.find(t => 'focus' in t && t.focus); }

	/**
	 * Indica si una terminal dada tiene el foco.
	 * @param pty Terminal
	 */
	public haveFocus(term: successfulConnection) {

		// Comprueba si existe el pid
		if (term.pid && term.host) {

			// Obtiene la terminal con el foco.
			const focused = this.getFocusedPty();

			// Comprueba que se haya encontrado la terminal con el foco.
			if (focused) {

				if (focused.host === term.host && 'pid' in focused && focused.pid === term.pid) return true
				else return false;

			} else return false;

		} else return false;

	}

	/**
	 * Vuelve a enlazar las terminales existentes con los contenedores correspondientes.
	 * @param host Identificador del servidor.
	 * @param pid Identificador de proceso.
	 * @param element Contenedor.
	 */
	public reBindTerminal(host: string, auth: string, pid: string, element: HTMLDivElement) {

		// Busca la terminal correspondiente.
		const term = this.terms.find(t =>
			t.auth === auth && t.host === host && 'pid' in t && t.pid === pid
		) as successfulConnection;

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
				this.keyListeners.push(term.terminal.onKey(({ domEvent }) => {
					this.write(domEvent)
				}))
				
			// Abre la terminal en el elemento.
			} else term.terminal.open(element);

			// Comprueba si hay datos en el historial y los añade.
			if (term.history) {
				
				// Espera un poco para que la terminal se haya instanciado correctamente.
				setTimeout(() => {

					// Escribe en la terminal.
					term.terminal.write(term.history as string);

					// Elimina el historial.
					term.history = undefined;

				}, 200)
				
			}

		}

	}

	/**
	 * Añade una conexión pendiente de inicialización.
	 * @param params Parámetros de conexión al servidor.
	 */
	public addPendingInit(params: minimalIdentify) { this.pending.push(params as incommingConnection) }

	/**
	 * Elimina un error de conexión del array.
	 * @param error Objeto de error de conexión.
	 */
	public deleteError(error: connectionError) {
		// Elimina el error de conexión del array.
		this.connectionErrors.splice(this.connectionErrors.indexOf(error), 1);
	}

	public findTerminal(data: minimalIdentify) {

		// Comprueba que existan los datos mínimos.
		if ('auth' in data && 'host' in data) {
			
			// Comprueba si el pid ha sido establecido
			if (data.pid) {

				// Busca en el array.
				const search = this.terms.find((t: any) => t.auth === data.auth && t.host === data.host && t.pid === data.pid) as successfulConnection

				// Si no ha encontrado nada, intenta buscar sin el pid.
				if (!search) {
					return this.terms.find(t => t.auth === data.auth && t.host === data.host);
				} else return search;
			}
			
			return this.terms.find(t => t.auth === data.auth && t.host === data.host);


		} else return undefined;

	}

	public cleanUp() {

		this.terms.forEach((term, index) => {

			if ('terminal' in term) {
				term.terminal.dispose();
				term.element = undefined as any;
			}

			this.terms.splice(index, 1);

		})

		this.eventController.cleanUp();

		this.eventController = undefined as any;

	}
	
	public removeWriteEvents() {

		this.keyListeners.forEach(a => a.dispose());
	}

}