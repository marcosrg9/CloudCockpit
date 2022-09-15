import { Socket } from 'socket.io';
import { sessionStore } from '../../database/stores/session.store';
import { socketStore } from '../../database/stores/socket.store';

export class AdminEvents {

	/**
	 * Carga los eventos para usuarios administradores.
	 * @param socket Socket del cliente.
	 */
	constructor(private socket: Socket) {

		// Comprueba que el usuario sea administrador.
		if (socket.handshake.session.auth.role === 'admin') this.loadAdminEvents();

	}

	/** Carga los eventos de administrador. */
	private loadAdminEvents() {

		// Escucha el evento de petición de sockets conectados.
		this.socket.on('getSockets', this.onGetSockets.bind(this));
		
		// Escucha el evento de petición de sesiones abiertas.
		this.socket.on('getSessions', this.onGetSessions.bind(this));

	}

	/** Obtiene los sockets conectados y los envía al administrador. */
	private onGetSockets() {

		this.socket.emit('connectedSockets', socketStore.getAllSockets());

	}

	/** Obtiene la lista de sesiones y las envía al administrador. */
	private onGetSessions() {

		this.socket.emit('openSessions', sessionStore.getAllRecords());
	}
	
}