import { auths } from '../database/auth.db';
import { servers } from '../database/servers.db';
import { sessionStore } from '../database/stores/session.store';
import { socketStore } from '../database/stores/socket.store';
import { connectionError, inProgressConnection, successfulConnection, writeEvent } from '../interfaces/connection.interface';
import { sizeParams } from './ssh.model';
import { Terminal } from './terminal.model';

export class User {

	/** Almacena los id de sesiones. */
	private sessions: 	string[] = [];

	/** Almacena las terminales. */
	private terminals = new Map<string, Terminal>();

	constructor(public readonly user: string) { }

	/**
	 * Emite un evento a una terminal concreta.
	 * @param data Datos para insertar en el flujo.
	 */
	public emitToTerm(data: writeEvent) {

		// Obtiene una terminal por el id.
		const terminal = this.terminals.get(data.pid);

		// Escribe en la terminal.
		if (terminal) terminal.write(data.data);

	}

	/**
	 * Emite a todos los usuarios un mensaje a través de un canal específico.
	 * @param channel Canal de datos.
	 * @param message Mensaje.
	 */
	public broadcast(channel: string, ...message: any) {

		// Recorre todas las sesiones.
		this.sessions.forEach(id => {

			// Obtiene una sesión por su id.
			const session = sessionStore.getRecord(id);

			// Comprueba que la sesión sea válida.
			if (session && session.sockets && session.sockets.length > 0) {

				// Recorre la colección de sockets.
				session.sockets.forEach(id => {

					// Obtiene el socket por el id de socket.
					const socket = socketStore.get(id);
	
					// Si ha encontrado un socket, emite al cliente.
					if (socket) socket.emit(channel, ...message);

				})


			}

		})

	}

	/**
	 * Instancia una nueva terminal.
	 * @param server Identificador del servidor.
	 * @param credentials Identificador de las credenciales.
	 * @param size Parámetros de dimensiones.
	 */
	public openTerminal(server: string, credentials: string, size: sizeParams) {

		// Prepara las consultas a la base de datos.
		const queries = Promise.allSettled([
			servers.getRecordById(server),
			auths.getRecordById(credentials)
		]);

		// Resuelve las consultas.
		queries.then(([s, a]) => {

			// Comprueba si ha fallado la búsqueda.
			if (s.status === 'rejected' || a.status === 'rejected') {

				return this.broadcast('openTerminalError', {
					host: server,
					auth: credentials,
					errors: { server: s, auth: a }
				} as unknown as connectionError)

			}

			// Extrae los parámetros.
			const { _id: sid, host, port, auths } = s.value;
			const { _id: aid, username, password } = a.value;

			// Instancia la terminal.
			const term = new Terminal(sid, host, port, this, aid, username, password, size)

			this.broadcast('connectionUpdate', {
				status: term.status,
				host: server,
				auth: credentials,
				resolved: { host, user: username, port }
			} as inProgressConnection)

			// Intenta conectarse con los parámetros indicados.
			term.connect()
			.then(pid => {

				// Avisa a los usuarios de que la conexión ha sido abierta.
				this.broadcast('connectionUpdate', {
					status: term.status,
					pid: term.pid,
					at: term.at,
					host: server,
					auth: credentials,
					resolved: { host, user: username, port }
				} as successfulConnection);
				
				// Añade la terminal al mapa.
				this.terminals.set(pid, term);

			})
			.catch(err => {

				this.broadcast('openTerminalError', {
					host: server,
					auth: credentials,
					error: err
				} as connectionError)

			})

		})

	}

	public getAllTerminals() { return this.terminals };

	/**
	 * Devuelve todas las sesiones de los dispositivos conectados con esta cuenta.
	 */
	public getAllSessions() { return this.sessions };

	/**
	 * Añade un nuevo identificador de sesión al usuario conectado.
	 * @param id Identificador de la sesión.
	 */
	public appendSession(id: string) { this.sessions.push(id) }

	public removeSession(id: string) {

		// Busca el índice.
		const index = this.sessions.indexOf(id);

		// Elimina la sesión.
		if (index !== -1) this.sessions.splice(index, 1);

	}

}