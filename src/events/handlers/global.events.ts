import { Session, SessionData } from 'express-session';
import { Socket } from 'socket.io';
import { minimalIdentification } from '../../../public/src/app/interfaces/pty.interface';
import { auths } from '../../database/auth.db';
import { servers } from '../../database/servers.db';
import { sessionStore } from '../../database/stores/session.store';
import { socketStore } from '../../database/stores/socket.store';
import { userStore } from '../../database/stores/user.store';
import { connection, openConnection } from '../../interfaces/unifiedStructure.interface';
import { logger } from '../../models/logger.model';
import { AbstractSocket } from '../abstractSocket.events';

export class GlobalEvents extends AbstractSocket {

	/** Sesión del cliente. */
	private session: SessionData & Partial<Session>;

	/**
	 * Controla los eventos globales de la plataforma.
	 * @param socket Instancia del socket del usuario.
	 */

	constructor(private socket: Socket) {

		super(socket, ['getServers', 'getTerminals', 'getTerminal', 'newTerminal', 'prepareTerminal', 'disconnect'])

		// Asigna la sesión del usuario a la propiedad.
		this.session = this.socket.handshake.session;

		// Evento de petición de lista de servidores.
		this.socket.on('getServers', this.onGetServers.bind(this));

		// Maneja el evento de obtención de terminales.
		this.socket.on('getTerminals', this.onGetTerminals.bind(this))

		// Maneja el evento de petición de datos de terminal.
		this.socket.on('getTerminal', this.onGetTerminal.bind(this));
		
		// Evento de petición de conexión SSH.
		this.socket.on('newTerminal', this.onNewTerminal.bind(this));

		// Evento de solicitud de incialización de conexión.
		this.socket.on('prepareTerminal', this.onPrepare.bind(this));
		
		// Evento de desconexión de usuario.
		this.socket.on('disconnect', this.disconnect.bind(this));

	}

	/**
	 * Obtiene una lista de servidores.
	 */
	// TODO: Basura por todos lados. Y si cambiamos de mongo a SQLite??
	private onGetServers() {

		servers.getServersOfUser(this.session.auth._id)
		.then(async(servers) => {

			// 1. Buscar las credenciales.
			// 2. Asignar a cada servidor.

			const serverMap = new Map<string, any>()

			// Genera un array de promesas de consultas personalizadas.
			const query = servers.flatMap(server => {

				if (server.auths.length < 1) serverMap.set(server._id, server);
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

					} else {
						logger.warning('WebSocket', r.reason.name)
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

			const terminals: connection[] = [];
			
			user.getAllTerminals().forEach(term => {

				// Desestructura el objeto para que el resto sea la información válida.
				const { status, authId: auth, serverId: host, pid, at, buffer: history, server, username: user, port } = term;

				// 
				const data: connection = {
					status, auth, host, pid, at, history, resolved: { host: server, user, port: port.toString() }
				}

				// Inserta el resto en el array de terminales.
				terminals.push(data);

			});

			// Emite al usuario con las terminales.
			this.socket.emit('terminals', terminals);

		// Si no encuentra al usuario, destruye la sesión.
		} else sessionStore.destroy(this.socket.handshake.session.id);
	
	}

	private onGetTerminal(data: minimalIdentification) {

		if (!data.auth || !data.host) this.socket.emit('requestError', { code: 'missing_required_data' });

		const user = userStore.get(this.session.auth._id);

		if (!user) {
			// TODO: Handle disconnection.
		}
		
		//@ts-ignore
		for (let [i, term] of Array.from(user.getAllTerminals())) {
			const { serverId, authId, pid, server, username, port, status } = term;

			if (serverId === data.host && authId === data.auth && pid === data.pid) {
				this.socket.emit('terminalData', {
					auth: authId,
					host: serverId,
					pid: pid,
					status,
					resolved: { host: server, user: username, port }
				} as connection)
				
				break;
			};

		}
		
	}

	private onPrepare(data: minimalIdentification) {

		// Busca la instancia del usuario.
		const user = userStore.get(this.session.auth._id);

		// Si el usuario no ha sido encontrado o no hay sesiones, desconecta inmediatamente el socket.
		if (!user || user.getAllSessions().length === 0) return this.disconnect('User not exists.');

		// Prepara la terminal.
		user.prepareTerminal(data.host, data.auth)
		.then(terminal => {
			// Emite al socket el identificador de terminal.
			this.socket.emit('preparedTerminal', terminal);
		})
		.catch(err => {
			this.socket.emit('prepareTerminalError', err);
			logger.error('GlobalWebSocketEvent', err)

		})

	}

 	private onNewTerminal(data: openConnection) {

		// Busca la instancia del usuario.
		const user = userStore.get(this.session.auth._id);

		// Desconecta el socket si no ha encontrado al usuario.
		if (!user) this.disconnect('User not exists.');

		// Si no hay sesiones, se detiene.
		if (user.getAllSessions().length === 0) return;

		// Crea una nueva terminal.
		user.openTerminal(data.pid, data.size)
		.then(() => {

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

		})


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
	
}