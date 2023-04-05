import { minimalIdentification } from '../../public/src/app/interfaces/pty.interface';
import { auths } from '../database/auth.db';
import { Auth } from '../database/entity/Auth';
import { Server } from '../database/entity/Server';
import { servers } from '../database/servers.db';
import { sessionStore } from '../database/stores/session.store';
import { socketStore } from '../database/stores/socket.store';
import { TerminalStore } from '../database/stores/terminal.store';
import { connectionError, writeEvent } from '../interfaces/connection.interface';
import { ConnectedSshSession, ConnectingSshSession, WaitingSshSession } from '../interfaces/unifiedStructure.interface';
import { prepareTerminalValidator } from '../validators/prepareParams.validator';
import { logger } from './logger.model';
import { sizeParams } from './ssh.model';
import { Terminal } from './terminal.model';

export class User {

	/** Almacena los id de sesiones. */
	private sessions: 	string[] = [];

	/** Almacena las terminales. */
	public termStore: TerminalStore;

	/**
	 * Instancia de un usuario en memoria.
	 * @param user Identificador del usuario.
	 */
	constructor(public readonly user: string) {
		this.termStore = new TerminalStore(this);
	}

	/**
	 * Emite un evento a una terminal concreta.
	 * @param data Datos para insertar en el flujo.
	 */
	public emitToTerm(data: writeEvent) {

		// Obtiene una terminal por el id.
		const terminal = this.termStore.get(data.pid);

		// Escribe en la terminal.
		if (terminal) terminal.write(data.data);

	}

	/**
	 * Emite a todos los usuarios un mensaje a través de un canal específico.
	 * @param channel Canal de datos.
	 * @param message Mensaje.
	 */
	// BUG: Identificadores de datos repetidos en el almacén. Salida duplicada en el cliente.
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

	public prepareTerminal(host: string, auth: minimalIdentification['auth']): Promise<WaitingSshSession> {
		
		// Valida los parámetros.
		const validator = prepareTerminalValidator.validate({ host, auth }, { stripUnknown: true });

		// Si la validación ha producido error, devuelve una promesa rechazada.
		if (validator.error) return Promise.reject({ error: 'Validation error', reason: validator.error });

		let queries: Promise<[PromiseSettledResult<Server>,PromiseSettledResult<Auth | { _id: string, username: string, password: string }>]>

		if (typeof auth === 'string') {
			// Prepara las consultas para resolver los datos de servidor y credenciales.
			queries = Promise.allSettled([
				servers.getRecordById(host),
				auths.getRecordById(auth)
			])
		} else {
			queries = Promise.allSettled([
				servers.getRecordById(host),
				Promise.resolve({...auth, _id: 'manual'})
			])
		}

		return new Promise((resolve, reject) => {
			// Realiza las consultas.
			queries.then(([s, a]) => {
				
				if (s.status === 'rejected' || a.status === 'rejected') return reject({ error: 'Query error', reason: { server: s, auths: a }});
	
				// Extrae los parámetros.
				const { _id: sid, host, port, auths, name } = s.value;
				const { _id: aid, username, password } = a.value;
	
				// Instancia la terminal.
				const term = new Terminal(sid, host, port, this, aid, username, password);
	
				// Asigna la terminal instanciada al almacén.
				this.termStore.set(term.pid, term);

				const data: WaitingSshSession = {
					status: 'waiting',
					host: sid,
					history: '',
					pid: term.pid,
					at: term.at,
					auth,
					resolved: { host: name, user: username, port: term.port.toString() }
				}
	
				// Devuelve una promesa resuelta con el pid de la conexión.
				resolve(data);
	
			})
			.catch(err => {
				console.error(err);
			})

		})

	}

	/**
	 * Instancia una nueva terminal.
	 * @param pid Identificador de conexión.
	 * @param size Parámetros de dimensiones.
	 */
	public async openTerminal(pid: string, size: sizeParams) {

		// Busca la terminal.
		const term = this.termStore.get(pid);

		// Comprueba si no ha encontrado la terminal o no es válida.
		if (!term || !(term instanceof Terminal)) return Promise.reject('Terminal no encontrada');

		// Reestablece las dimensiones de la terminal.
		term.resize(size);

		const { serverId, authId, server, username, port } = term;

		this.broadcast('connectionUpdate', {
			status: term.status,
			pid: term.pid,
			at: term.at,
			host: serverId,
			auth: authId,
			resolved: { host: server, user: username, port }
		} as ConnectingSshSession)

		// Intenta conectarse con los parámetros indicados.
		return term.connect()
		.then(pid => {

			const { serverId, authId, server, username, port } = term;

			// Emite a los usuarios el estado de la conexión.
			this.broadcast('connectionUpdate', {
				status: term.status,
				pid: pid,
				at: term.at,
				host: serverId,
				auth: authId,
				resolved: { host: server, user: username, port }
			} as ConnectedSshSession);

		})
		.catch(err => {
			logger.error('terminal', err)
			console.warn(err)
		})

	}

	public getAllTerminals() { return this.termStore };

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