import { sessionStore } from '../database/stores/session.store';
import { socketStore } from '../database/stores/socket.store';
import { userStore } from '../database/stores/user.store';

export class Session {

	/** Identificador de los sockets asociados a esta sesión. */
	public sockets: string[] = [];

	/** Temporizador de cuenta atrás de destrucción. */
	public timeout: NodeJS.Timeout;

	/**
	 * Abstracción con mejoras de la clase Session de express-session.
	 * @param sid Identificador de sesión.
	 * @param uid Identificador del usuario.
	 */
	constructor(public sid: string, public uid: string) {

		// Añade la sesión al usuario.
		userStore.addSession(sid);

	}

	/**
	 * Emite a un usuario de la sesión.
	 * @param event Nombre del evento.
	 * @param message Mensaje a emitir al cliente.
	 */
	public emitToUser(event: string, ...message: any) {

		// Comprueba si existe al menos un id de socket.
		if (this.sockets.length > 0) {

			// Mapea un array con los objetos de los sockets.
			const sockets = this.sockets.map((socket, index) => {

				// Busca en el almacén.
				const _ = socketStore.get(socket);
				
				// Si no encuentra el socket lo elimina.
				if (!_) this.sockets.splice(index, 1);
				
				// Si lo encuentra, emite el evento.
				_.emit(event, ...message);

			});

		}

	}

	public startAutoDestroyer() {
		
		// Nota: mejor usar un cronjob?? Muchos temporizadores pueden afectar al rendimiento del servidor.
		this.timeout = setTimeout(() => {
			
			sessionStore.destroy(this.sid);

		// Minutos * Segundos * Milisegundos
		}, 5 * 60 * 1000)

	}

	public stopAutoDestroyer() {

		// Comprueba que la cuenta atrás de destrucción está activa.
		if (this.timeout) {

			// Detiene la cuenta atrás.
			clearTimeout(this.timeout);
			
			// Limpia el objeto.
			this.timeout = null;

		}
	}

	/**
	 * Enlazar la sesión con un socket y detiene el temporizador de destrucción.
	 * @param id Nuevo identificador del socket.
	 */
	public attachSocket(id: string) {

		// Reasigna el identificador del socket nuevo.
		this.sockets.push(id);

		// Detiene el temporizador de destrucción.
		this.stopAutoDestroyer()

	}

	public removeSocket(id: string) {

		// Busca el socket.
		const index = this.sockets.findIndex(sktId => sktId === id);

		// Si no lo encuentra se detiene (no existía).
		if (index < 0) return;

		// Lo elimina del conjunto.
		this.sockets.splice(index, 1);

		// Si no quedan sockets, establece el temporizador de destrucción.
		if (this.sockets.length < 1) this.startAutoDestroyer();
	}

}