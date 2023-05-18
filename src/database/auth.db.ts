import { ObjectId } from 'mongodb';
import { DeleteResult } from 'typeorm';
import { encrypt } from '../helpers/cypher.helper';
import { newAuthFromClient } from '../interfaces/auth.interface';
import { credentialsValidator, updateCredentialsValidator } from '../validators/credentials.validator';
import { AppDataSource } from './data-source';
import { AbstractDataManagerById } from './database_abstraction';
import { Auth } from './entity/Auth';
import { servers } from './servers.db';

class AuthDatabase extends AbstractDataManagerById<Auth> {

	constructor() {
		console.log(`${new Date().toISOString()} – ✓ Cargando administrador de credenciales...`)
		super(Auth, [ 'username', 'password' ]);
	}

	/**
	 * Crea una nueva credencial y la asigna al servidor especificado.
	 * @param id Identificador del servidor al que se le asignará las credenciales.
	 * @param data Parámetros de credencial.
	 */
	public async newCredential(id: string, data: newAuthFromClient) {

		// Comprueba si el identificador de servidor no es válido.
		if (!id || typeof id !== 'string' || id.length < 24) return Promise.reject('Server id missing');

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
		} catch (err) {
			// Asigna la marca de estado de cifrado a falso.
			validation.value.enc = false;
		}

		// Genera una nueva credencial.
		const credential = new Auth();

		// Asigna los datos.
		Object.assign(credential, validation.value);

		try {
			
			// Crea el conjunto de promesas para crear la credencial y obtener el servidor asociado.
			const [ server ] = await Promise.all([servers.getRecordById(id), AppDataSource.manager.insert(Auth, credential)]);

			// Inserta en el array de credenciales la credencial creada.
			server.auths.push(new ObjectId(credential._id));

			await servers.updateRecord(server._id.toString(), server);
			
			return credential;

		} catch (err) {

			return err

		}

	}

	public async getRecordByUsername(user: string) {
		return AppDataSource.manager.findOneByOrFail(Auth, { username: user });
	}

	/**
	 * Actualiza los parámetros de una credencial.
	 * @param aid Identificador de la terminal asignada al servidor.
	 * @param data Parámetros de credencial.
	 */
	public async updateRecord(id: string, data: any) {

		const validation = updateCredentialsValidator.validate(data, { stripUnknown: true });

		if (validation.error) return Promise.reject(validation.error);

		return await super.updateRecord(id, data);

	}

	public deleteRecord(id: string): Promise<DeleteResult> {
		
		return super.deleteRecord(id)
		.then(() => servers.deleteAuthFromServer(id));

	}

}

/**
 * Instancia del administrador de credenciales.
 */
export const auths = new AuthDatabase();