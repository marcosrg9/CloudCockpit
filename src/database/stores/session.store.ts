import { Session } from '../../models/session.model';
import { memoryStore } from './memory.store';
import { socketStore } from './socket.store';
import { userStore } from './user.store';

/*
	Notas al margen:
	Las sesiones en memoria se serializan.

	Esto es un gran inconveniente, cuando se desea acceder a propiedades no primitivas u objetos
	con referencias circulares, teniendo en cuenta que la propiedad handshake de un socket
	contiene la sesión, no es posible almacenar el socket en la sesión, pues al almacenar la
	sesión, se convierte a cadena el objeto (serialización - JSON.stringify).

	Función set del paquete express-session - Serialización a cadena de un objeto.
	https://github.com/expressjs/session/blob/1010fadc2f071ddf2add94235d72224cf65159c6/session/memory.js#L120

	La serialización de objetos con referencias circulares lanza un error.

	Además, no hay forma de administrar las sesiones una vez el socket se ha desconectado.
	Si el usuario se desconecta del servidor websockets, la sesión permanece en memoria, aunque
	haya caducado, esta seguirá en memoria, para solucionar esto, el socket debe establecer un
	timeout y destruir la sesión manualmente pasado cierto tiempo.

	Esta arquitectura es necesaria porque se tiene mayor control sobre todas las instancias,
	si el usuario se desconecta (accidentalemte) y el servidor destruye la sesión, al volver a
	conectarse, la sesión habrá sido destruída, por lo tanto el cliente ya no tendrá las
	credenciales asignadas a su sesión.

	⚠️ Advertencia:
		Desactivar la opción resave en el middleware express-session.
		Cuando está activado, la sesión se vuelve a guardar una vez enviada.
		Si el almacén ha sido alterado, los datos de la petición (req.session) se vuelven a
		introducir en el almacén.

*/

class SessionStore {
	
	/** Almacén de sesiones. */
	private store = new Map<string, Session>();

	/**
	 * Obtiene un registro del almacén.
	 * @param id Identificador de sesión.
	 */
	public getRecord(id: string) { return this.store.get(id) }

	/**
	 * Establece un registro en el almacén.\
	 * ⚠️ Este método se encarga de buscar en el almacén en memoria de forma automática.
	 * @param id Identificador de sesión.
	 */
	public setRecord(id: string) {

		/* // Busca primero en el almacén.
		const session = this.store.get(id);

		// Si encuentra una sesión con el identificador, detiene el temporizador.
		if (session) return session.stopAutoDestroyer(); */

		// Obtiene la sesión del almacén.
		memoryStore.get(id, (err, session) => {
			
			// Si ha devuelto una sesión, la instancia e inserta en el almacén.
			if (session) this.store.set(id, new Session(id, session.auth._id.toString()))

		})

	}

	/**
	 * Activa el temporizador de destrucción de sesión.
	 * @param id Identificador de sesión.
	 */
	public setAutoDestroy(id: string, options: { deleteSocketRef: boolean } = { deleteSocketRef: true }) {

		// Busca la sesión en el almacén.
		const session = this.store.get(id);

		// Comprueba si se ha encontrado.
		if (session) {
			if (options.deleteSocketRef) session.startAutoDestroyer()
			else session.startAutoDestroyer();
		}

	}

	/**
	 * Destruye una sesión específica.
	 * @param id Identificador de sesión.
	 */
	public destroy(id: string) {

		return new Promise<void>((resolve, reject) => {

			// Destruye la sesión.
			memoryStore.destroy(id, (err) => {

				// Detiene la ejecución si se ha producido un error.
				//if (err) return reject(err);
	
				// Busca la sesión.
				const session = this.getRecord(id);
	
				// Si no se ha encotnrado la sesión, detiene la ejecución.
				if (!session) return resolve();
	
				// Detiene el destructor inmediatamente.
				session.stopAutoDestroyer()

				// Elimina la sesión del usuario.
				userStore.removeSession(session.sid, session.uid);
	
				// Elimina el registro si no se ha producido ningún error.
				this.store.delete(id);
	
				// Comprueba si no existe un identificador de socket.
				if (session.sockets.length < 1) return resolve();
	
				// Destruye el socket.
				socketStore.destroy(session.sockets);

				return resolve();
					
			})

		})

	}

	/** Devuelve toda la lista de sesiones. */
	public getAllRecords() {

		const sessions = [];

		this.store.forEach(val => sessions.push(val.sid))

		return sessions;

	}
	
}

export const sessionStore = new SessionStore();