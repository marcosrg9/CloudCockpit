import { ObjectID } from 'typeorm';
import { hash } from 'bcryptjs';
import { AppDataSource } from './data-source';
import { AbstractDataManagerById } from './database_abstraction';
import { User } from './entity/User';
import { cipherAvailable, encrypt } from '../helpers/cypher.helper';

export interface user {
	_id?: 			string,
	username: 		string,
	password: 		string,
	role: 			'admin' | 'standard'
}

export interface newUser {
	username:		string,
	password:		string,
	role:			user['role']
}

class UserDatabase extends AbstractDataManagerById<User> {

	constructor() {
		console.log(`${new Date().toISOString()} – ✓ Cargando administrador de usuarios...`);
		super(User, ['password']);
	}

	public async createUser(user: newUser) {

		try {

			// Crea una instancia del usuario.
			const usr = new User();
			
			// Hashea la contraseña.
			let pass = await hash(user.password, 10);

			// Cifra la contraseña si el servicio está disponible.
			if (await cipherAvailable()) {

				// Cifra la contraseña.
				const cyphed = await encrypt(pass);

				// Vuelve a asignar la contraseña cifrada concatenada con el vector de inicialización.
				pass = cyphed.cyphed + cyphed.iv;

				// Marca la contraseña como cifrada.
				usr.enc = true;

			}
			
			// Reasigna la contraseña.
			user.password = pass;
	
			// Copia las propiedades.
			Object.assign(usr, user);

			// Devuelve la promesa.
			return AppDataSource.manager.insert(User, usr);
			
		} catch (error) { Promise.reject(error) }

	}

	public async getUserByUsername(username: string) {

		return AppDataSource.manager.findOneByOrFail(User, { username });

	}
}

export const users = new UserDatabase();