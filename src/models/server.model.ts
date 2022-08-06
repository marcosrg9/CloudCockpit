import { Server as HTTPServer } from 'http';
import Express from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';

import { ClientThroughSsh } from './clientThroughSsh.model';

export class Server {
	
	private api = Express();
	private server: HTTPServer;
	private sockets: SocketIOServer;


	constructor() {

		this.server = new HTTPServer(this.api);
		this.sockets = new SocketIOServer(this.server, {cors: {origin: '*'}});

		this.sockets.on('connect', this.handleConnect)

		//this.api.use(cors({origin: '*'}))

		// TODO: Cargar middlewares

		// TODO: Cargar rutas

		this.server.listen(3000, () => {
			console.log('Running!');
		})
		
	}

	private handleConnect(socket: Socket) {

		new ClientThroughSsh(socket);
		
	}

}