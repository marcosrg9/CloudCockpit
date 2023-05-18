import { WebsocketsService } from '../services/websockets.service';

interface resolveRejectChannels {
	/** Nombre del canal de solución de consulta. */
	resolve: string
	/** Nombre del canal de rechazo de consulta. */
	reject: string
	/** Nombre del canal del evento de petición de consulta. */
	request: string
}

interface storeChannels {
	/** Conjunto de nombres de canales para petición de datos. */
	get: resolveRejectChannels
	/** Conjunto de nombres de canales de definción de datos. */
	set: resolveRejectChannels
	/** Conjunto de nombres de canales de eliminación de datos. */
	delete?: resolveRejectChannels
}

export abstract class SyncedCacheStore<K, T> {

	/** Almacén en memoria. */
	protected store = new Map<K, T>();

	/**
	 * Reflejo del almacén como array.\
	 * Manipular el contenido no tendrá efecto alguno sobre el almacén de la memoria.
	 * Esta propiedad existe para permitir realizar un recorrido fácilmente.
	 */
	public reflect: Readonly<T[]> = [];

	/**
	 * Abstracción del almacén de elementos sincronizado con el servidor.
	 * @param _keyId Nombre de la propiedad del genérico T usada como clave para almacenar el elemento.
	 * @param _socketService Socket de conexión con el servidor.
	 * @param _updateChannel Nombre del canal de actualización de datos.
	 * @param _storeDataChannels Nombres de los canales de datos.
	 */
	constructor(private readonly _keyId: K,
				private _socketService: WebsocketsService,
				private _updateChannel: string,
				private _storeDataChannels: storeChannels) { }

	/**
	 * Obtiene un elemento del almacén
	 * @param id Identificador del elemento.
	 * @returns Promesa que resuelve un elemento.
	 */
	public get(id: K): Promise<Partial<T>> {

		const element = this.store.get(id);

		if (element) return Promise.resolve(element);

		return this.promisifyEvent(this._storeDataChannels.get)
		.then(data => {
			this.store.set(data[this._keyId], data);
			this.reflect = Array.from(this.store).map(([k, v]) => v);
			return data;
		})

	}

	/**
	 * Emite al servidor la inserción del elemento y después lo inserta en la caché.
	 * @param data Elemento a insertar.
	 */
	public set(data: Partial<T>): Promise<T> {
		return this.promisifyEvent(this._storeDataChannels.set, data)
		.then(data => {
			data = data[0];
			this.store.set(data[this._keyId], data);
			this.performReflection();
			return data;
		})
	}

	public delete(id: K): Promise<boolean> {
		if (!this._storeDataChannels.delete) return Promise.reject('There are no elimination events')
		return this.promisifyEvent(this._storeDataChannels.delete, id)
		.then(() => {
			const deletion = this.store.delete(id);
			this.performReflection();
			return deletion;
		})
	}

	/**
	 * Regenera el reflejo de solo lectura del almacén en memoria.
	 */
	protected performReflection() {
		this.reflect = Object.freeze(Array.from(this.store).map(([k, v]) => v));
	}

	protected promisifyEvent(channels: resolveRejectChannels, ...data: any[]): Promise<any> {

		return new Promise((resolve, reject) => {

			const rejectHandler = (...err: any[]) => {
				this._socketService.removeListener(channels.reject, rejectHandler);
				this._socketService.removeListener(channels.resolve, resolveHandler);
				reject(err);
				console.error(err);
			}

			const resolveHandler = (...data: any[]) => {
				this._socketService.removeListener(channels.reject, rejectHandler);
				this._socketService.removeListener(channels.resolve, resolveHandler);

				resolve(data);
			}

			this._socketService.once(channels.reject, rejectHandler);
			this._socketService.once(channels.resolve, resolveHandler);

			this._socketService.emit(channels.request, ...data);

		});
		
	}

	/**
	 * Recorre todo el almacén de credenciales.
	 */
	public forEach(callbackfn: (value: T, key: K) => void) {
		this.store.forEach(callbackfn);
	}

}