import { Socket } from 'socket.io';
import { sessionStore } from '../../database/stores/session.store';
import { socketStore } from '../../database/stores/socket.store';
import { userStore } from '../../database/stores/user.store';
import { AbstractSocket } from '../abstractSocket.events';

export class DeveloperEvents extends AbstractSocket {

	constructor(private socket: Socket) {

		super(socket, ['dump:stores']);

		//console.log(`${new Date().toISOString()} – ⚠️ Eventos de desarrollador cargados.`);

		// Vuelca los almacenes.
		this.socket.on('dump:stores', this.dump.bind(this));

	}

	private dumpStores() {
		console.log(sessionStore)
		console.log(socketStore)
	}

	/**
	 * Vuelca datos de la memoria según el nivel.
	 * @param level Nivel de volcado.
	 */
	private dump(level: number) {

		// Volcado 0 - Montón de pila.
		if (level === 0) {}

		// Volcado 1 - Almacenes.
		else if (level === 1) {

			console.log(userStore.get(this.socket.handshake.session.id).termStore);

		}

		// Volcado 2 - Conexiones SSH.
		else if (level === 2) {

			console.log()

		}

		// Volcado 3 - Usuarios.
		else if (level === 3) {}

		// Volcado 4 - Sesiones.
		else if (level === 3) {}

		// Volcado 5 - Sockets.
		else if (level === 3) {}

	}
}