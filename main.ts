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
import { freemem, totalmem } from 'os';

PlatformHelper.parseLastMagnitude(freemem());
PlatformHelper.parseLastMagnitude(totalmem());
class Main {

	public server: Server;

	/** Indica si la instancia corre sobre docker */
	public readonly runningOverDocker = isDocker();

	constructor() {

		console.log(`CloudCockpit ${ pkg.version }`)

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
}

/** Escucha los eventos de excepciones no controladas. */
process.on('uncaughtException', (err, origin) => {

	console.error(err.stack)
	console.error('exception')
	logger.error('platform', err.stack, 'node.event.uncaughtException')

}).on('unhandledRejection', (reason, promise) => {

	console.error('Rejection')
	logger.error('platform', reason as string, 'node.event.unhandledRejection');

})

/** Instancia principal de la plataforma CloudCockpit. */
export const main = new Main();