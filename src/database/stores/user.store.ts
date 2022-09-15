import { ObjectID } from 'typeorm';
import { User } from '../../models/user.model';
import { user } from '../user.db';
import { memoryStore } from './memory.store';

class UserStore {

	private store = new Map<string, User>();

	/**
	 * Añade un identificador de sesión a un usuario.
	 * @param sid Identificador de sesión.
	 */
	public addSession(sid: string) {
		
		// Busca al usuario en el almacén en memoria.
		memoryStore.get(sid, (err, session) => {

			// Si no se ha encontrado la sesión, detiene la ejecución.
			if (!session || !session.auth || !session.auth._id) return;

			// Obtiene el id del usuario.
			const id = session.auth._id.toString();

			// Obtiene el usuario del almacén.
			const user = this.store.get(id);

			// Si el usuario existe, añade el id de sesión.
			if (user) return user.appendSession(sid);

			// Si no existe, lo crea.
			const newUser = new User(session.auth._id.toString());

			// Añade el id de sesión al usuario.
			newUser.appendSession(sid);

			// Inserta el usuario en el almacén.
			this.store.set(id, newUser)

		})

	}

	/**
	 * Elimina una sesión de la cuenta de usuario.
	 * @param sid Identificador de sesión.
	 * @param uid Identificador de usuario (permite encontrar la sesión rápidamente).
	 */
	public removeSession(sid: string, uid?: string) {

		// Si incluye el usuario, se procede a buscar la clave en el almacén.
		if (uid) {

			const user = this.store.get(uid);

			if (user) user.removeSession(sid);

		} else {

			// Por cada usuario, elimina la sesión (no deberían existir duplicados).
			this.store.forEach(user => {
				user.removeSession(sid);
			})

		}

	}

	/**
	 * Obtiene un usuario por un identificador de sesión.
	 * @param id Identificador del usuario.
	 */
	public get(id: string) {

		return this.store.get(id.toString());

	}

}

export const userStore = new UserStore();