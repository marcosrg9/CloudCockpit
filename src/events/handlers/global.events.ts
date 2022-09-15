import { Session, SessionData } from 'express-session';
import { Socket } from 'socket.io';
import { auths } from '../../database/auth.db';
import { servers } from '../../database/servers.db';
import { sessionStore } from '../../database/stores/session.store';
import { socketStore } from '../../database/stores/socket.store';
import { userStore } from '../../database/stores/user.store';
import { newConnection, successfulConnection } from '../../interfaces/connection.interface';
import { TerminalEvents } from './terminal.events';

export class GlobalEvents {

	/** Sesión del cliente. */
	private session: SessionData & Partial<Session>;

	/**
	 * Controla los eventos globales de la plataforma.
	 * @param socket Instancia del socket del usuario.
	 */
	
	constructor(private socket: Socket) {

		// Asigna la sesión del usuario a la propiedad.
		this.session = this.socket.handshake.session;

		// Evento de petición de lista de servidores.
		this.socket.on('getServers', this.onGetServers.bind(this));

		// Maneja el evento de obtención de terminales.
		this.socket.on('getTerminals', this.onGetTerminals.bind(this))
		
		// Evento de petición de lista de servidores.
		this.socket.on('newTerminal', this.onNewTerminal.bind(this));
		
		// Evento de desconexión de usuario.
		this.socket.on('disconnect', this.disconnect.bind(this));

	}

	/**
	 * Obtiene una lista de servidores.
	 */
	private onGetServers() {

		servers.getServersOfUser(this.session.auth._id)
		.then(async(servers) => {

			// 1. Buscar las credenciales.
			// 2. Asignar a cada servidor.

			const serverMap = new Map<string, any>()

			// Genera un array de promesas de consultas personalizadas.
			const query = servers.flatMap(server => {

				return server.auths.map(auth => {

					// Modifica la respuesta de la promesa.
					return new Promise<{server, auth}>((resolve, reject) => {

						auths.getRecordById(auth.toString())
						.then(auth => {
							const { password, ...r } = auth;
							resolve({ server, auth: r })
						})
						.catch(err => reject(err));

					})
				})	

			})

			Promise.allSettled(query).then(data => {
				data.forEach(r => {

					if (r.status === 'fulfilled') {

						const { auth: resolvedAuth, server: s } = r.value;

						const server = serverMap.get(s._id.toString());

						if (server) server.auths.push(resolvedAuth)
						else {

							const { auths, ...r } = s;
							
							serverMap.set(s._id.toString(), { ...r, auths: [ resolvedAuth ] })

						}

					}

				})

				this.socket.emit('serverData', Array.from(serverMap, ([k, v]) => v));
			})

			// Devuelve los datos al cliente.
			//this.socket.emit('serverData', Array.from(serverMap, ([k, v]) => v));
			//this.socket.emit('serverData', servers);


		})
		.catch(err => {

			console.error(err)

		})
		
	}

	/**
	 * Manejador del evento getTerminal.
	 * Devuelve las terminales.
	 */
	private onGetTerminals() {

		// Busca el usuario.
		const user = userStore.get(this.socket.handshake.session.auth._id);

		if (user) {

			const terminals: successfulConnection[] = [];
			
			user.getAllTerminals().forEach(term => {

				// Desestructura el objeto para que el resto sea la información válida.
				const { status, authId, serverId, pid, at, buffer , server, username, port } = term;

				// Inserta el resto en el array de terminales.
				terminals.push({
					status,
					auth: authId,
					host: serverId,
					pid,
					at,
					history: buffer,
					resolved: { host: server, user: username, port: port.toString() }
				} as successfulConnection)

			});

			// Emite al usuario con las terminales.
			this.socket.emit('terminals', terminals);

		// Si no encuentra al usuario, destruye la sesión.
		} else sessionStore.destroy(this.socket.handshake.session.id);
	
	}

	private onNewTerminal(data: newConnection) {

		// Busca la instancia del usuario.
		const user = userStore.get(this.session.auth._id);

		// Si ha encontrado al usuario, realiza las acciones.
		if (user) {

			// Si no hay sesiones, se detiene.
			if (user.getAllSessions().length === 0) return;

			// Crea una nueva terminal.
			user.openTerminal(data.host, data.auth, data.size);

			// Obtiene todas las sesiones vinculadas al usuario y las recorre.
			user.getAllSessions().forEach(sid => {

				// Busca la sesión del usuario de la iteración.
				const session = sessionStore.getRecord(sid);

				// Si no encuentra la sesión, la elimina y se detiene.
				if (!session) return user.removeSession(sid);

				// Recorre el conjunto de sockets.
				session.sockets.forEach(id => {

					// Busca el socket.
					const socket = socketStore.get(id);
	
					// Si no encuentra el socket, se detiene.
					if (!socket) return;
	
					// Carga los eventos de terminal.
					socket.loadTerminalEvents();

				})


			})

		} else this.disconnect('User not exists.');

	}

	/**
	 * Maneja el evento de desconexión del socket.
	 */
	private disconnect(reason: string) {
		
		// Destruye el socket inmediatamente.
		socketStore.destroy(this.socket.id);
		
		// Elimina todos los oyentes de eventos.
		this.removeAllListeners();

		// Bussca la sesión.
		const session = sessionStore.getRecord(this.session.id);

		// Elimina el socket de la sesión.
		if (session) session.removeSocket(this.socket.id);

	}

	public removeAllListeners() {

		this.socket.removeAllListeners('getServers');
		this.socket.removeAllListeners('disconnect');

	}
}