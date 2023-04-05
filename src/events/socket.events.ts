import { Socket } from 'socket.io';
import { sessionStore } from '../database/stores/session.store';
import { socketStore } from '../database/stores/socket.store';
import { userStore } from '../database/stores/user.store';
import { AdminEvents } from './handlers/admin.events';
import { DeveloperEvents } from './handlers/developer.events';
import { GlobalEvents } from './handlers/global.events';
import { TerminalEvents } from './handlers/terminal.events';

export class ClientSocket {

	/** Identificador del socket del cliente. */
	public id: string;

	public global: GlobalEvents;
	public terminal: TerminalEvents;
	public admin: AdminEvents;
	public developer: DeveloperEvents;

	/**
	 * Abstracción de socket de SocketIO.
	 * Almacena los manejadores de eventos y se encarga de decidir si un usuario tiene
	 * autorización para mantener la conexión.
	 * @param socket Instancia del socket del usuario.
	 */
	constructor(public socket: Socket) {
		
		// Maneja la conexión.
		this.handleConnection();

		// Asigna el id del socket a la propiedad id.
		this.id = socket.id;
		
	}
	
	/**
	 * Maneja el evento de conexión para comprobar si el cliente está autorizado a mantener
	 * la conexión.
	 */
	private handleConnection() {
		
		// Desconecta al usuario si no ha iniciado sesión.
		if (!this.socket.handshake.session || !this.socket.handshake.session.auth) {

			// Informa al usuario de que no está autorizado a conectarse.
			this.socket.emit('authError');

			// Desconecta al usuario.
			return this.socket.disconnect(true);
		}
		
		// Busca la sesión en el almacén.
		const session = sessionStore.getRecord(this.socket.handshake.sessionID);

		// Si la sesión no existe, se cierra la conexión.
		if (!session) return this.socket.disconnect(true);
		// Si existe, se enlaza el socket con la sesión.
		// TODO: Adjunta el socket si existe la sesión, pero después lo añade al almacén.
		// TODO: Comprobar si el duplicado de salida proviene de aquí.
		else session.attachSocket(this.socket.id);

		// Instancia los controladores de eventos.
		this.global = new GlobalEvents(this.socket);

		// Instancia el controlador de eventos de terminal si existe alguna.
		if (userStore.get(this.socket.handshake.session.auth._id).termStore.size > 0) {
			this.terminal = new TerminalEvents(this.socket)
		};

		// Instancia los eventos de administrador.
		if (this.socket.handshake.session.auth.role === 'admin') {
			this.admin = new AdminEvents(this.socket)
		}

		if (process.env.NODE_ENV === 'dev' || process.env.FORCE_DEV === 'true') {
			this.developer = new DeveloperEvents(this.socket);
			console.log(`${new Date().toISOString()} – ⚠️ Eventos de desarrollador cargados.`);
		}

		// Se almacena este socket en el almacén.
		/**
		 * Nota: esto se debe a que un constructor no puede devolver nada,
		 * por lo tanto, no se puede comprobar si este socket puede mantenerse
		 * vivo, para ello, se almacena de forma automática desde dentro.
		 * Es la opción menos cutre de las posibles.
		 */
		// BUG: Revisar esto con la función attachSocket.
		socketStore.add(this.socket.id, this);

		this.socket.emit('readyToListen');
		
	}

	/**
	 * Emite un evento con los datos especificados.
	 * @param event Nombre del evento.
	 * @param args Datos a emitir.
	 */
	public emit(event: string, ...args: any) { this.socket.emit(event, ...args) }

	public loadTerminalEvents() {

		if (!this.terminal) {
			this.terminal = new TerminalEvents(this.socket);
		}

	}

	// Desconecta al socket.
	public disconnect() {
		this.socket.disconnect(true);
		
		socketStore.destroy(this.socket.id);
	}

	/** Elimina todos los oyentes de eventos de todos los controladores. */
	public removeAllListeners() {
		
		this.global.removeAllListeners();
		if (this.terminal) this.terminal.removeAllListeners();

	}

	/**
	 * Destruye el socket.
	 */
	public destroy() {
		
		// Limpieza de oyentes de eventos.
		this.removeAllListeners();

		// Desconexión.
		this.socket.disconnect(true);

		// Limpieza de referencias.
		this.socket = null;
		this.id = null;
		this.global = null;
		this.terminal = null;
	}

}