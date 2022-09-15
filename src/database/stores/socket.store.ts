import { Server } from 'socket.io';
import { ClientSocket } from '../../events/socket.events';

/*

	Notas al margen:
	Hay ciertas inconsistencias evidentes en el uso de identificación por sockets.

		- Si el usuario abre una nueva pestaña del navegador, habrá dos sockets.
		  Si hay dos sockets, habrá instancias separadas de terminales, por lo tanto verá
		  una terminal en una pestaña y otra en la otra.
		
		- Si el cliente elimina un servidor en una pestaña pero ya tiene abierta una terminal
		  en otra, esta se mantendría abierta si el manejo de eventos no ha sido preparado.

	Es conveniente usar una asociación de sockets a las sesiones, los sockets son efímeros y
	pierden la identificación fácilmente.
	Igualmente no se puede abrir un socket si no hay una sesión abierta con credenciales, por
	lo que se asegura que no existen sockets no vinculados a una sesión.

	Cuando el usuario se desconecte y el tiempo de destrucción sea alcanzado, la instancia
	deberá enviar una señal de destrucción al almacén de sesiones usando el id del handshake.

*/

class SocketStore {

	/** Almacén de sockets. */
	private store = new Map<string, ClientSocket>();

	/** Almacén interno de sockets. */
	public internalSockets: Server['sockets']['sockets'];

	/** Almacén interno de salas. */
	public internalRooms: Server['sockets']['adapter']['rooms']

	/**
	 * Inserta un socket en el almacén.
	 * @param id Identificador del socket.
	 * @param socket Socket del cliente (abstracción de socket).
	 */
	public add(id: string, socket: ClientSocket) { this.store.set(id, socket) }

	/**
	 * Obtiene un socket por el identificador.
	 * @param id Identificador del socket.
	 */
	public get(id: string) { return this.store.get(id) }

	public disconnectAndCleanUp() {



	}

	/**
	 * Elimina un socket del almacén.
	 * @param id Identificador del socket.
	 */
	public destroy(id: string | string[]) {

		// Si el tipo del id es una cadena, asigna un array con ese id.
		if (typeof id === 'string') id = [id];

		// Recorre el conjunto.
		id.forEach(id => {

			// Busca el socket en el almacén.
			const socket = this.store.get(id);
	
			// Detiene la ejecución si no existe.
			if (!socket) return;
			
			// Desconecta al usuario.
			socket.destroy();
	
			// Elimina el socket del almacén.
			this.store.delete(id);

		})


	}

	/** Devuelve toda la lista de sockets. */
	public getAllSockets() {
		
		const sockets = [];

		this.store.forEach(socket => sockets.push(socket.id));

		return sockets;

	}

	/**
	 * Asigna el almacén interno de sockets de SocketIO.
	 * @param server Instancia del servidor SocketIO.
	 */
	public assignInternalSocketStore(server: Server) {

		// Asigna el almacén interno de sockets.
		this.internalSockets = server.sockets.sockets;

		// Asigna el almacén interno de salas.
		this.internalRooms = server.sockets.adapter.rooms;

	}
}

export const socketStore = new SocketStore();