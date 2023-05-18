import { ObjectId } from 'mongodb';
import { cipherAvailable, decrypt, encrypt } from '../helpers/cypher.helper';
import { mergeDiffProperties } from '../helpers/object.helper';
import { AppDataSource } from './data-source';
import { EntityIdentifiedById } from './entity/AbstractID';

export abstract class AbstractDataManagerById<T extends EntityIdentifiedById> {

	/**
	 * Almacenamiento en memoria de registros para la entidad proporcionada.
	 * Reduce la cantidad de consultas a la base de datos a cambio de un consumo
	 * mínimo de memoria (proporcional a la cantidad de registros leídos).
	 */
	protected store = new Map<string, T>();
	
	/**
	 * Abstracción de modelo de administración de colecciones para registros de entidades
	 * identificado por id.
	 * @param entity Entidad de referencia para el acceso a la base de datos.
	 * @param cyphedKeys Colección de claves cifradas.
	 */
	constructor(private entity: { new (...args: any[]) },
				private cyphedKeys?: string[] ) { }
	
	/**
	 * Busca un recurso identificado por el id proporcionado en la base de datos o memoria.
	 * @param id Identificador del recurso.
	 */
	public async getRecordById(id: string): Promise<T> {

		try {
			
			// Busca el registro en memoria.
			const recordFromMemory = this.store.get(id);

			// Si se encuentra el registro, lo devuelve como una promesa resuelta.
			if (recordFromMemory) return Promise.resolve(recordFromMemory);

			// En caso contrario, obtiene el registro desde la base de datos.
			const record = await AppDataSource.manager.findOneByOrFail(this.entity, { _id: new ObjectId(id) });

			// Comprueba si hay una colección de claves de objeto cifrado y además el documento está cifrado.
			if (this.cyphedKeys && record.enc) {

				// Mapea un array de promesas.
				const decrypts = this.cyphedKeys.map(key => {
					return new Promise<[key: string, value: string]>((resolve, reject) => {

						// Modifica la salida de la promesa.
						decrypt(record[key])
						.then(value => resolve([key, value]))
						.catch(err => reject(err));
						
					})
				});

				try {

					const resolver = await Promise.allSettled(decrypts);

					resolver.forEach(r => {
						if (r.status === 'fulfilled') {

							const [ key, value ] = r.value;

							// Reasigna la información descifrada.
							record[key] = value;

						}
					})
					
				} catch (error) { }
				
			}

			// Inserta el registro en memoria.
			this.store.set(id.toString(), record);

			// Devuelve la promesa resuelta con el registro.
			return Promise.resolve(record);
			
		// Rechaza la promesa con la excepción devuelta.
		} catch (error) { return Promise.reject(error) }

	}

	/**
	 * Obtiene todos los registros de la colección.
	 * Nota: esto no guarda los registros devueltos en el almacén.
	 */
	public getAllRecords(): Promise<T[]> { return AppDataSource.manager.find(this.entity) };

	/**
	 * Actualiza una entrada del registro de la colección.\
	 * Este método se encarga de fusionar los cambios.
	 * @param id Identificador del recurso.
	 * @param data Conjunto de datos para actualizar.
	 */
	public async updateRecord(id: string, data: any): Promise<T> {

		try {
			
			// Obtiene la colección de la entidad.
			const repo = AppDataSource.getMongoRepository(this.entity);

			// Genera el objeto identificador.
			const identifier = new ObjectId(id);
	
			// Obtiene el registro.
			const record = await repo.findOneByOrFail({ _id: identifier }) as T;
	
			// Obtiene el nuevo registro con los cambios y descifra las propiedades.
			const newRecord = mergeDiffProperties(await this.decrypt(record), data, ['_id']) as T;
			
			// Guarda los cambios.
			repo.save(await this.encrypt(newRecord));

			// Descifra los datos y crea una nueva referencia.
			const decrypted = await this.decrypt(newRecord, true);

			// Reasigna el identificador.
			decrypted._id = id;

			// Establece el registro en el almacén.
			this.store.set(id, decrypted);

			return decrypted;
		
		} catch(err) {

			return err

		}


	};


	/**
	 * Elimina un registro de la colección.
	 * @param id Identificador del recurso.
	 */
	public deleteRecord(id: string) {

		return AppDataSource.manager.delete(this.entity, { _id: new ObjectId(id) })
	}

	/**
	 * Devuelve el número de registros de la colección.
	 */
	public getRecordsCount() {

		return AppDataSource.manager.count(this.entity);

	}

	/**
	 * Cifra los datos proporcionados.
	 * @param data Datos a cifrar.
	 */
	protected async encrypt(data: T, clone = false): Promise<T> {

		try {

			// Si el cifrado no está disponible, se devuelven los datos tal cual.
			if (!await cipherAvailable()) return data;
			
			// Si no existen propiedades a cifrar, se devuelve los datos.
			if (!this.cyphedKeys || this.cyphedKeys.length < 1) return data;
			
			if (clone) data = structuredClone(data);

			const prom = await Promise.allSettled(this.cyphedKeys.map(k => encrypt(data[k]) ));

			prom.forEach((v, i) => {
				if (v.status === 'fulfilled') data[this.cyphedKeys[i]] = v.value.cyphed + v.value.iv;
			});

			return data;

		} catch (err) {
			return err
		}	

	}

	protected async decrypt(record: T, clone = false): Promise<T> {

		// Si no hay colección de claves de objeto cifrado o el mismo no lo está, lo devuelve.
		if (!this.cyphedKeys || !record.enc) return record;

		// Clona el registro obtenido para crear una nueva referencia.
		if (clone) record = structuredClone(record);

		// Mapea un array de promesas.
		const decrypts = this.cyphedKeys.map(key => {
			return new Promise<[key: string, value: string]>((resolve, reject) => {

				// Modifica la salida de la promesa.
				decrypt(record[key])
				.then(value => resolve([key, value]))
				.catch(err => reject(err));
				
			})
		});

		try {

			const resolver = await Promise.allSettled(decrypts);

			resolver.forEach(r => {
				if (r.status === 'fulfilled') {

					const [ key, value ] = r.value;

					// Reasigna la información descifrada.
					record[key] = value;

				}
			})

			return record;
			
		} catch (err) {
			return err
		}

	}


}