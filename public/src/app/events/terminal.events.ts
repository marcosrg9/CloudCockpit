import { isDevMode } from '@angular/core';
import { connection, writeEvent, connectionError } from '../../../../src/interfaces/unifiedStructure.interface';
import { stores } from '../data/store.data';
import { terminalStore } from '../data/terminal.store';
import { ConnectedWebTerminal, isConnectedWebTerm, WebTerminal } from '../interfaces/pty.interface';
import { TerminalService } from '../services/terminal.service';
import { WebsocketsService } from '../services/websockets.service';

/**
 * Controla los eventos del servicio de terminales.
 * Maneja la lógica de eventos.
 */
export class TerminalEventsController {

	constructor(private terminals: TerminalService,
				private socket: WebsocketsService) {

		// Vincula la propiedad con la referencia del almacén de terminales.
		//this.terms = terminals.terms;
		
		// Escucha los eventos.
		this.listenEvents();

		// Solicita la colección de terminales.
		this.socket.emit('getTerminals');

		// Si el entorno es de desarrollo, muestra un mensaje indicando que se ha cargado el controlador.
		if (isDevMode()) console.log('%c✅ Cargando oyente de eventos de terminales', 'background: green; color: white; padding: 2px');		

	}

	private listenEvents() {

		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.once('terminals', this.onceTerminals.bind(this));

		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.on('terminalData', this.onWriteHandler.bind(this));
		
		// Escucha el evento de actualización de estado de conexión para una terminal.
		this.socket.on('connectionUpdate', this.onConnectionUpdate.bind(this));

		// Escucha el evento de error de apertura de terminal.
		this.socket.on('openTerminalError', this.onTerminalConnectionError.bind(this));
		
		// Escucha el evento de error de conexión a un servidor.
		this.socket.on('terminalConnectionError', this.onTerminalConnectionError.bind(this));

		// Escucha el evento de desconexión proveniente de la terminal.
		this.socket.on('terminalExit', this.onDisconnectHandler.bind(this));

	}

	// Carga en memoria las terminales provenientes del servidor.
	// En principio el almacén de terminales debería estar vacío.
	// Este evento solo se dispara una sola vez desde la instanciación del controlador de eventos.
	private onceTerminals(terms: connection[]) {

		// Aparentemente el tipo de connection no es compatible con el connection de WebTerminal.
		// No hay otra alternativa viable que hacer un casteo.

		terms.forEach(con => {
			const { history } = con;
			const term = <WebTerminal>{ connection: { ...con, history: this.replaceStrangeCharacters(history) } }	
			terminalStore.set(term.connection.pid, term);
		})

	};
	

	/**
	 * Maneja el evento de nueva terminal.
	 * @param data Parámetros de conexión.
	 */
	 /* private onOpenTerminal(data: { server: string, user: string, resolved: { server: string, user: string, port: string } }) {
	
		console.log(data);

		// Busca la terminal sin pid
		const pty = this.terms.find(pty => pty.serverId === data.server && pty.authId === data.user && !pty.pid);

		if (pty) {

			// Vuelve a establecer los datos para las identificaciones.
			if (data.resolved) {

				pty.server = data.resolved.server;
				pty.auth = data.resolved.user;
				pty.port = data.resolved.port
				pty.pid = data.pid;

			}
			
			// Quita el foco a todas las terminales.
			this.blurAll();
			
			//pty.terminal = terminal;
			pty.focus = true;

		// No se ha instanciado desde este navegador.
		} else {

			const { server, user, pid, resolved } = data;

			this.terms.push({
				server: resolved.server,
				serverId: server,
				auth: resolved.user,
				authId: user,
				pid: pid,
				port: resolved.port,
			})

		}

	} */
	
	/**
	 * Maneja el evento de entrada de terminal.
	 * @param data Evento de escritura.
	 */
	private onWriteHandler(data: writeEvent) {

		// Busca la terminal.
		const terminal = this.terminals.findTerminal(data.pid);

		
		// Comprueba si ha encontrado la terminal.
		if (terminal) {
			
			// Comprueba si incluye una instancia de terminal.
			if (terminal.terminal) {
				
				// En zsh para macOS se producen caracteres extraños (en mi equipo).
				data.data = this.replaceStrangeCharacters(data.data);

				// Inserta los datos.
				terminal.terminal.write(data.data);

				// Resuelve el bug de pérdida de datos en el prompt.
				terminal.terminal.scrollToBottom();

				return;
			}

			if (!terminal.connection.history) return terminal.connection.history = data.data
			else return terminal.connection.history += data.data;

		};

		// No ha encontrado la terminal, la crea.

		// Desestructura los datos del evento.
		const { data: history,  ...r } = data;

		// Crea una nueva terminal.
		const newTerminal = {
			connection: r, focus: false
		} as WebTerminal;

		// Inserta la terminal.
		this.terminals.store.set(r.pid, newTerminal);

	}

	/**
	 * Maneja el evento de actualización de estado de conexión con el servidor.
	 */
	private onConnectionUpdate(data: connection) {

		const term = this.terminals.store.get(data.pid);

		// TODO: Añadir comportamiento para cuando no exista la terminal en el almacén.
		if (!term) return;

		term.connection = data;

	}

	private onTerminalConnectionError(data: connectionError) {

		// Inserta el error en el conjuto de errores.
		this.terminals.connectionErrors.push(data);

		this.terminals.store.delete(data.pid);

		// Si no quedan más terminales, vuelve al menú principal.
		if (this.terminals.store.reflectedTerminalStoreArray.length < 1) this.terminals.router.navigate(['/main'])

	}

	private onDisconnectHandler(data: connection) {

		const term = this.terminals.store.get(data.pid);

		if (!term) return;

		if (isConnectedWebTerm(term) && term.terminal) {
				term.terminal.dispose();
		}

		const deletion = this.terminals.store.delete(data.pid);
		
		if (this.terminals.store.reflectedTerminalStoreArray.length < 1) return this.terminals.router.navigate(['/main']);

		if (deletion) {
			this.terminals.store.reflectedTerminalStoreArray[0].focus = true;
		}

	}

	public cleanUp() {

		this.socket.removeAllListeners('terminals');
		this.socket.removeAllListeners('terminalData');
		this.socket.removeAllListeners('connectionUpdate');
		this.socket.removeAllListeners('openTerminalError');
		this.socket.removeAllListeners('terminalConnectionError');
		this.socket.removeAllListeners('terminalExit');

	}

	private replaceStrangeCharacters(data: string) {
		data = data.replace('$<2>', '');

		return data;
	}

}