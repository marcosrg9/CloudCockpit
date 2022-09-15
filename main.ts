import { config } from 'dotenv';

// Carga las variables de entorno inmediatamente para la base de datos.
config();

import { auths } from './src/database/auth.db';
import { AppDataSource } from './src/database/data-source';
import { platform } from './src/database/platform.db';
import { servers } from './src/database/servers.db';
import { Server } from './src/models/server.model';

class Main {

	public server: Server;

	constructor() {

		// Inicializa la conexión a la base de datos.
		AppDataSource.initialize()
		.then(async () => {
					
			const params = await platform.getPlatformParams();
		
			// Inicia el servidor en el puerto especificado.
			if (params.port) new Server(params.port)
			// Si no existe, significa que la plataforma no ha sido inicializada.
			else this.server = new Server();
			
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
// TODO: Implementar los loggers.
process.on('uncaughtException', (err, origin) => {

	console.error(err.stack)

}).on('unhandledRejection', (reason, promise) => {

	console.error(reason)

})

/** Instancia principal de la plataforma CloudCockpit. */
export const main = new Main();