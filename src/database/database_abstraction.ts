import { ObjectID } from 'typeorm';
import { ObjectId } from 'mongodb';
import { decrypt } from '../helpers/cypher.helper';
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
			const record = await AppDataSource.manager.findOneBy(this.entity, { _id: new ObjectId(id) });

			// Comprueba si no existe las credenciales y rechaza la promesa.
			if (!record) return Promise.reject('Record not found');

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
			this.store.set(id, record);

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
	 * Actualiza una entrada del registro de la colección.
	 * @param id Identificador del recurso.
	 * @param data Conjunto de datos para actualizar.
	 * //TODO: Actualizar los registros en memoria.
	 */
	public updateRecord(id: string, data: any) {
		return AppDataSource.manager.update(this.entity, { _id: new ObjectId(id) }, data)
	};


	/**
	 * Elimina un registro de la colección.
	 * @param id Identificador del recurso.
	 */
	public deleteRecord(id: string) {

		return AppDataSource.manager.delete(this.entity, { _id: new ObjectId(id) });
	}

	/**
	 * Devuelve el número de registros de la colección.
	 */
	public getRecordsCount() {

		return AppDataSource.manager.count(this.entity);

	}


}