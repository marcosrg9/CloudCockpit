import { isDevMode } from '@angular/core';
import { connectionError, writeEvent } from '../../../../src/interfaces/connection.interface';
import { incommingConnection, inProgressConnection, minimalIdentify, processingConnection, successfulConnection, withTerminalData } from '../interfaces/pty.interface';
import { TerminalService } from '../services/terminal.service';
import { WebsocketsService } from '../services/websockets.service';

/**
 * Controla los eventos del servicio de terminales.
 */
export class TerminalEventsController {

	private terms: TerminalService['terms'];

	constructor(private terminals: TerminalService,
				private socket: WebsocketsService) {

		// Vincula la propiedad con la referencia del almacén de terminales.
		this.terms = terminals.terms;
		
		// Escucha los eventos.
		this.listenEvents();

		// Solicita la colección de terminales.
		this.socket.emit('getTerminals');

		// Si el entorno es de desarrollo, muestra un mensaje indicando que se ha cargado el controlador.
		if (isDevMode()) console.log('%c✅ Cargando oyente de eventos de terminales', 'background: green; color: white; padding: 2px');		

	}

	private listenEvents() {

		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.once('terminals', this.onTerminals.bind(this));

		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.on('terminalData', this.onWriteHandler.bind(this));
		
		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.on('connectionUpdate', this.onConnectionUpdate.bind(this));

		// Escucha el evento de error de apertura de terminal.
		this.socket.on('openTerminalError', this.onTerminalConnectionError.bind(this));
		
		// Escucha el evento de inserción de datos provenientes de la terminal.
		this.socket.on('terminalConnectionError', this.onTerminalConnectionError.bind(this));

		// Escucha el evento de desconexión proveniente de la terminal.
		this.socket.on('terminalExit', this.onDisconnectHandler.bind(this));

	}

	// Carga en memoria las terminales provenientes del servidor.
	private onTerminals(terms: successfulConnection[]) {
		terms.forEach(term => {
			if (term.history) term.history = this.replaceStrangeCharacters(term.history);
			this.terminals.terms.push(term)
		});
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
	
	private onWriteHandler(data: writeEvent) {

		// Busca la terminal.
		const terminal = this.terminals.findTerminal(data) as successfulConnection;

		// En zsh para macOS se producen caracteres extraños (en mi equipo).
		data.data = this.replaceStrangeCharacters(data.data);

		// Comprueba si ha encontrado la terminal.
		if (terminal) {

			// Comprueba si incluye una instancia de terminal.
			if (terminal.terminal) {

				// Inserta los datos.
				terminal.terminal.write(data.data);

				// Resuelve el bug de pérdida de datos en el prompt.
				terminal.terminal.scrollToBottom();

				return;
			}

			if (!terminal.history) return terminal.history = data.data
			else return terminal.history += data.data;

		};

		// Desestructura los datos del evento.
		const { data: history, ...r } = data;

		// Crea una nueva terminal.
		const newTerm: incommingConnection = { ...r, history, focus: false };

		// Inserta la terminal.
		this.terms.push(newTerm);

	}

	/**
	 * Maneja el evento de actualización de estado de conexión con el servidor.
	 */
	private onConnectionUpdate(data: inProgressConnection | successfulConnection) {
		
		// Busca la terminal
		let terminal = this.terms.find(t => t.host === data.host && t.auth === data.auth) as (incommingConnection | processingConnection | successfulConnection);
		const index = this.terms.findIndex(t => t.host === data.host && t.auth === data.auth);

		/**
		 * Esto se lanza varias veces.
		 * En ocasiones, no es capaz de encontrar la terminal, por lo tanto crea una nueva.
		 */

		// No se ha encontrado la terminal, se añade al array.
		if (!terminal) {
			return this.terms.push(data)
		};

		// Comprueba si existen datos de instancia de terminal.
		if ('terminal' in terminal && 'element' in terminal) {

			// Asigna a los datos de la respuesta 
			data.terminal = terminal.terminal
			data.element = terminal.element

			// Asigna el foco si lo tiene
			if (terminal.focus) data.focus = true;

		}

		// Reasigna los datos.
		this.terms[index] = data;

	}

	private onTerminalConnectionError(data: connectionError) {

		// Inserta el error en el conjuto de errores.
		this.terminals.connectionErrors.push(data);

		// Busca el índice de la terminal.
		const pty = this.terms.findIndex(pty => pty.host === data.host && pty.auth === data.auth);

		// Si existe, la elimina.
		if (pty >= 0) this.terms.splice(pty, 1);

		// Si no quedan más terminales, vuelve al menú principal.
		if (this.terms.length < 1) this.terminals.router.navigate(['/main'])

	}

	private onDisconnectHandler(data: minimalIdentify) {

		const index = this.terms.findIndex((t: any) => t.auth === data.auth && t.host === data.host && t.pid === data.pid);

		if (index >= 0) {
			
			const terminal = this.terms[0] as successfulConnection;

			if (terminal.terminal && terminal.element) {
				terminal.terminal.dispose();
				terminal.element = undefined as any;
				terminal.terminal = undefined as any;
			}

			this.terms.splice(index, 1);
			
			if (this.terms.length < 1) this.terminals.router.navigate(['/main']);
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