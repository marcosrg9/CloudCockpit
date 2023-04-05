import { encrypt } from '../helpers/cypher.helper';
import { credentialsValidator } from '../validators/credentials.validator';
import { AppDataSource } from './data-source';
import { AbstractDataManagerById } from './database_abstraction';
import { Auth } from './entity/Auth';

class AuthDatabase extends AbstractDataManagerById<Auth> {

	constructor() {
		console.log(`${new Date().toISOString()} – ✓ Cargando administrador de credenciales...`)
		super(Auth, [ 'username', 'password' ]);
	}

	public async newCredential(data: { username: string, password: string, description?: string }) {

		// Valida los campos.
		const validation = credentialsValidator.validate(data, { stripUnknown: true });

		// Si se ha producido un error de validación, devuelve una promesa rechazada con el error.
		if (validation.error) return Promise.reject(validation.error);
		
		try {

			// Cifra los datos.
			const cyphed = await Promise.all([encrypt(data.username), encrypt(data.password)])

			// Asigna los datos.
			validation.value.username = cyphed[0].cyphed + cyphed[0].iv;
			validation.value.password = cyphed[1].cyphed + cyphed[1].iv;
			validation.value.enc = true;
			
		// No hay claves para el cifrado, se procede con los datos validados sin cifrar.
		} catch (error) {
			// Asigna la marca de estado de cifrado a falso.
			validation.value.enc = false;
		}

		// Genera una nueva credencial.
		const credential = new Auth();

		// Asigna los datos.
		Object.assign(credential, validation.value);

		// Devuelve la promesa de inserción de datos.
		return AppDataSource.manager.insert(Auth, credential);

	}

	public async getRecordByUser(user: string) {

		return AppDataSource.manager.findOneByOrFail(Auth, { username: user });
		
	}
}

export const auths = new AuthDatabase();