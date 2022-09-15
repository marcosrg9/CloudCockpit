import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import Express from 'express';
import cors from 'cors';
import session from 'express-session';
import { randomBytes } from 'crypto';
import sharedsession from 'express-socket.io-session';

import { ServerRouter } from '../routes/server.routes';
import { AuthRouter } from '../routes/auth.routes';
import { PlatformRouter } from '../routes/platform.routes';
import { ClientSocket } from '../events/socket.events';
import { memoryStore } from '../database/stores/memory.store';
import { sessionInterceptor } from '../middlewares/session.middleware';
import { socketStore } from '../database/stores/socket.store';

export class Server {
	
	/** Almacena la instancia de la api. */
	private api = 		Express();

	/** Almacena la instancia del servidor web. */
	private server:		HTTPServer;

	/** Almacena la instancia del servidor WebSockets. */
	public sockets: 	SocketIOServer;

	/** Almacena el almacén de sesiones. */
	private session: 	Express.RequestHandler<ParamsDictionary, any, any, ParsedQs, Record<string, any>>;

	/** Contiene el almacén en memoria que contendrá las sesiones. */
	private store = 	memoryStore;


	constructor(private port = 3000) {

		// Instancia un servidor web básico.
		this.server = new HTTPServer(this.api);

		// Instancia un servidor WebSockets.
		this.sockets = new SocketIOServer(this.server, { cors: { origin: '*' } });

		// Carga el manejador del evento de conexión de clientes al servidor WebSockets.
		this.sockets.on('connect', this.handleConnect);

		// Genera un almacén de sesiones.
		this.session = this.genSessionStore();

		// Carga los middlewares comunes.
		this.loadMiddlewares();

		// Carga las rutas.
		this.api.use(new AuthRouter().router);
		this.api.use(new ServerRouter().router);
		this.api.use(new PlatformRouter().router);

		// Asegura un número de puerto válido.
		if (typeof port !== 'number' || port > 65535) port = 3000;

		// Asigna al almacén de sockets los almacenes internos de sockets y salas.
		socketStore.assignInternalSocketStore(this.sockets);

		// Inicia el servidor.
		this.server.listen(port, () => {
			console.log(`${new Date().toISOString()} – ✓ Servidor en marcha http://localhost:${port}`);
		})
		
	}

	/** Genera y devuelve un almacén de sesiones. */
	private genSessionStore() {
		return session({
			store: this.store,
			secret: randomBytes(20).toString('hex'),
			// ⚠️ Mantener resave desactivado. Revisar las notas del almacén de sesiones.
			resave: false,
			saveUninitialized: true,
			cookie: { maxAge: process.env.NODE_ENV !== 'dev' ? 1000 * 60 * 60 : 9**99, httpOnly: false }
		})
	}

	/**
	 * Carga los middlewares básicos para el correcto funcionamiento de CloudCockpit.
	 */
	private loadMiddlewares() {

		// Carga el middleware cors.
		this.api.use(cors({ origin: '*' }));

		// Carga el parseador de cuerpos de peticiones.
		this.api.use(Express.json())

		// Carga el middleware de sesiones.
		this.api.use(this.session);
		
		// Carga el middlware de interceptador de sesiones.
		this.api.use(sessionInterceptor);

		// Carga el middleware de sesiones compartidas en el servidor WebSockets.
		this.sockets.use(sharedsession(this.session));

	}

	/** Maneja el evento de conexión de un nuevo cliente al servidor WebSockets. */
	private handleConnect(socket: Socket) {

		//new ClientThroughSsh(socket);
		new ClientSocket(socket)
		
	}

}