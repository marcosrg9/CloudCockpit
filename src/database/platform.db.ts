import { AppDataSource } from './data-source';
import { AbstractDataManagerById } from './database_abstraction';
import { Platform } from './entity/Platform';

class PlatformManager extends AbstractDataManagerById<Platform> {

	constructor() {
		super(Platform);
		console.log(`${new Date().toISOString()} – ✓ Cargando administrador de plataforma...`);
	}

	/**
	 * Obtiene los datos de la plataforma.
	 */
	public getPlatformParams() {
		
		return AppDataSource.manager.find(Platform)
		.then(a => {

			if (!a[0]) return Promise.reject()
			return Promise.resolve(a[0]);

		})
		.catch(err => Promise.reject(err))

	}

	/**
	 * Crea la primera instancia de la plataforma.
	 */
	public initialize() {

		// Obtiene los datos de la plataforma y continúa la ejecución si falla.
		// Significa que no existen datos.
		return this.getPlatformParams()
		.catch(() => {

			// Genera una nueva instancia de la plataforma.
			const platform = new Platform();
			platform.port = 3000;
	
			// Inserta la plataforma en la base de datos.
			return AppDataSource.manager.insert(Platform, platform)

		})

	}
	
	/**
	 * Cifra la base de datos con una nueva clave.
	 */
	public decryptAll() {

	}
}

/** Instancia única del administrador de la plataforma. */
export const platform = new PlatformManager();