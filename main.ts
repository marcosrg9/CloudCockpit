import { config } from 'dotenv';
// Carga las variables de entorno inmediatamente para la base de datos.
config();

import { AppDataSource } from './src/database/data-source';
import { platform } from './src/database/platform.db';
import { Server } from './src/models/server.model';

import pkg from './package.json'
import { env } from 'process';
import { logger } from './src/models/logger.model';
import { isDocker } from './src/helpers/isDocker.helper';
import { PlatformHelper } from './src/helpers/platform.helper';

class Main {

	public readonly nodeMinVersion = PlatformHelper.getNodeMinVersion();

	public readonly nodeVersion = process.versions.node;

	public server: Server;

	/** Indica si la instancia corre sobre docker */
	public readonly runningOverDocker = isDocker();

	/** Indica si el proceso corre en un entorno de desarrollo. */
	public readonly devEnv = process.env.NODE_ENV ? true : false;

	constructor() {

		if (this.nodeVersion < this.nodeMinVersion) {
			const msg = `The platform is using an older version of node than required.\nVersion ${this.nodeMinVersion} was required and ${this.nodeVersion} is being used.`
			this.kill(msg, true);
		}

		console.log('%c CloudCockpit\t\t\t\t', 'background-color: #0056FF; color: white');
		console.log(`%c Server with UI bundle v${ pkg.version }\t\t`, 'background-color: black; color: white');

		if (env.NODE_ENV === 'dev') console.log('%c Running on dev environment', 'background-color: orange; color: white')

		// Inicializa la conexión a la base de datos.
		AppDataSource.initialize()
		.then(async () => {
			
			try {
				const params = await platform.getPlatformParams();
			
				// Inicia el servidor en el puerto especificado.
				if (params.port) this.server = new Server(params.port)
				// Si no existe, significa que la plataforma no ha sido inicializada.
				else this.server = new Server();

				global.main = this

			} catch (error) {
				this.server = new Server();
			}
			
		})
		.catch(err => {
		
			// Muestra el error por consola.
			console.error(err);

			AppDataSource.destroy();
		
			// Finaliza la ejecución emitiendo el código 1 (error).
			process.exit(1);
		
		})

	}

	public kill(message: string, withError: boolean = false) {
		
		if (message && withError) {
			logger.error('kill', message)
			console.error(message);
		}

		withError ? process.exit(1) : process.exit();
	}
}

if (process.env.NODE_ENV !== 'dev') {

	/** Escucha los eventos de excepciones no controladas. */
	process.on('uncaughtException', (err, origin) => {
	
		console.error(err.stack)
		console.error('exception')
		logger.error('platform', err.stack, 'node.event.uncaughtException')
	
	}).on('unhandledRejection', (reason, promise) => {
	
		console.error('Rejection')
		logger.error('platform', reason as string, 'node.event.unhandledRejection');
	
	})
	
}


/** Instancia principal de la plataforma CloudCockpit. */
export const main = new Main();