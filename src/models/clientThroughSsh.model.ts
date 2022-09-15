import { Socket } from 'socket.io';
import { ObjectID } from 'typeorm';
import { auths } from '../database/auth.db';
import { server, servers } from '../database/servers.db';
import { wakeUpOnLan } from '../helpers/wakeOnLan.helper';
import { sizeParams, SshClient } from './ssh.model';


export class ClientThroughSsh {

	/** Almacena las terminales en un mapa identificado por los identificadores de procesos (pids) */
	private ptyStore: { pid: number, server: ObjectID, pty: SshClient }[] = [];

	/** Almacena la cuenta atrás que dispara la destrucción de las terminales */
	private countdown: NodeJS.Timeout;
	
	/**
	 * Almacena la sesión del usuario, incluye el socket y las sesiones de terminales.
	 * @param socket Socket del cliente.
	 */
	constructor(private socket: Socket) {

		// Empieza a escuchar los eventos del socket.
		this.listenEvents();
		
	}

	/**
	 * Escucha los eventos provenientes del socket del cliente.
	 */
	private listenEvents() {

		// Evento de petición de lista de servidores.
		this.socket.on('getServers', this.getServers.bind(this));

		// Evento de petición de nueva terminal.
		this.socket.on('open', this.openTerminal.bind(this));

		// Evento de petición de destrucción de terminal.
		this.socket.on('kill', this.killTerminal.bind(this));

		// Evento de petición de inserción de datos en el prompt de la terminal.
		this.socket.on('write', this.write.bind(this));
		
		// Evento de redimensionado del viewport de la terminal.
		this.socket.on('resize', this.resize.bind(this));

		// Evento de emisión de paquete mágico para encender dispositivos remotos.
		this.socket.on('wakeUp', this.wakeUp.bind(this));

		// Evento de ejecución de un snippet.
		// TODO: Falta por implementar.
		this.socket.on('runSnippet', () => {});

		// Evento de petición de datos de terminales.
		this.socket.on('getPtys', this.getPtys.bind(this));

		// Evento de desconexión del cliente.
		this.socket.on('disconnect', this.disconnect.bind(this));

	}

	private getServers() {

		servers.getAllRecords()
		.then(data => this.socket.emit('serversData', data) )
		.catch(err => this.socket.emit('fetchServerDataError', err));

	}

	/**
	 * Crea una nueva terminal.
	 */
	private async openTerminal(id: string, size: sizeParams) {

		// Obtiene los datos del servidor.
		const server = await servers.getRecordById(id);

		// Comprueba que se haya devuelto algo desde la base de datos.
		if (!server) return this.socket.emit('connectionError', { msg: `Server with ID ${id} does not exists in the database.` });

		// Comprueba que la dirección IP exista en el registro del servidor solicitado.
		if (!server.host) return this.socket.emit('connectionError', { msg: 'Host address does not exists.' });

		// TODO: Implementar un selector de credenciales.
		// Obtiene las credenciales para conectarse al servidor.
		const auth = await auths.getRecordById(server.auths[0].toString());

		// Crea la terminal.
		const pty = new SshClient({
			username: auth.username,
			password: auth.password,
			host: server.host,
			port: server.port ?? 22
		}, size);

		pty.connect()
		.then(stream => {

			// Pseudo pid
			// TODO: Usar un uuid más seguro que esto...
			// NOTA: El pid se trata como un número, por lo que para parsearlo en el frontend se
			// usa parseInt o parseFloat, es necesario eliminar estos métodos para que no haya
			// errores.
			const pPid = Math.random();

			this.termstore.push({
				pid: pPid,
				server: server._id,
				pty
			});

			this.socket.emit('openTerminal', pPid);

			stream.on('data', ((data: ArrayBuffer) => {
				this.socket.emit('data', {
					pid: pPid,
					server: server._id,
					data: data
				})
			}))
			// Cierre del flujo. El servidor no emite este evento.
			.once('close', () => {})
			// Evento de salida. El propio servidor emite esto cuando se ejecuta exit.
			.once('exit', () => {

				// Emite el evento de cierre de terminal.
				this.socket.emit('kill', server, pPid);

				// Destruye el flujo y corta la conexión.
				pty.close();

			})

		})
		.catch(err => {
		
			// Mata el proceso.
			pty.kill();

			// Informa al cliente.
			this.socket.emit('connectionError', { server, error: err});

		})
	}

	/**
	 * Destruye una terminal por su pid.
	 * @param pid Identificador de proceso
	 */
	private killTerminal(pid: number, server: string) {

		const pty = this.termstore.find(pty => pty.pid === pid && pty.server.toString() === server);

		if (pty) {
			pty.pty.close();
			this.socket.emit('kill', server, pid)
		}
		
	}

	/**
	 * Obtiene los pids de todas las terminales en ejecución y se los envía al cliente.
	 * @param cb Callback de respuesta al cliente, lo provee el evento del socket.
	 */
	private getPtys(cb: (pids: number[]) => {}) {

		// Crea un array vacío para almacenar los pids.
		const pids: number[] = [];
		
		// Recorre el mapa.
		this.termstore.forEach((pty, pid) => pids.push(pid))

		// Devuelve los datos al cliente mediante el callback.
		cb(pids);
	}

	/**
	 * Inserta datos en el prompt del terminal dado un pid.
	 * @param data Datos del prompt para insertar en la terminal.
	 */
	private write(data: { pid: number, server: string, data: string}) {

		// Obtiene la terminal del almacén por su pid.
		const pty = this.termstore.find(pty => pty.pid === data.pid && pty.server.toString() === data.server);

		// Inserta los datos en la terminal si existe.
		if (pty) pty.pty.write(data.data, false);
	}

	/**
	 * Redimesiona todas las terminales.
	 * @param params Parámetros de dimesiones.
	 */
	private resize(params: sizeParams) {
		
		this.termstore.forEach(pty => { pty.pty.resize(params) })
		
	}

	/**
	 * Emite un paquete mágico que enciende dispositivos remotos.
	 * @param id Identificador del servidor.
	 */
	private async wakeUp(id: string) {

		// Busca el servidor en la base de datos.
		const server = await servers.getRecordById(id);

		// Si no se ha encontra el servidor, se emite un evento.
		if (!server) this.socket.emit('wakeStatus', { status: 'error', msg: 'Servidor no encontrado.' });
		
		// Comprueba si existe la dirección física.
		if (!server?.MAC) return this.socket.emit('wakeStatus', { status: 'error', msg: 'Dirección física no registrada.' });

		// Intenta emitir el paquete y responde según el estado de la promesa.
		wakeUpOnLan(server.MAC, server.host)
		.then(() => this.socket.emit('wakeStatus', { status: 'success' }))
		.catch(err => this.socket.emit('wakeStatus', { status: 'error', msg: err }))

	}

	/**
	 * Se encarga de manejar el evento de desconexión del cliente o servidor (si corresponde)
	 * @param reason Razón de desconexión del socket.
	 */
	private disconnect(reason: string) {

			//TODO: mantener las terminales vivas durante un periodo de tiempo según la razón de desconexión.
			// Nota: asignar un identificador de sesión al cliente para reconocer el socket.

			// Comprueba si CloudCockpit corre en entorno de desarrollo.
			if (process.env.NODE_ENV === 'dev') {

				// Recorre el almacén de terminales.
				this.termstore.forEach(pty => {
	
					// Mata los procesos de las terminales.
					pty.pty.kill();
	
				})

			} else {

				// Cierra las terminales en 5 minutos.
				this.countdown = setTimeout(() => {
	
					// Recorre el almacén de terminales.
					this.termstore.forEach(pty => {
		
						// Mata los procesos de las terminales.
						pty.pty.kill();
		
					})
	
				}, 300000)

			}


	}

	/**
	 * Vuelve a unir los eventos de un socket antiguo con el nuevo sin tener que destruir las terminales.
	 */
	private reBindEvents() {

		// Recorre el mapa de terminales.
		this.termstore.forEach((pty, _) => {
			// TODO: Crear método para volver a enlazar el socket con los eventos anteriores.
		})
	}

	/**
	 * Se encarga de manejar la reconexión del cliente y asignar el nuevo socket.
	 * @param socket Nuevo socket.
	 */
	 public reconnectHandler(socket: Socket) {

		// Desactiva la cuenta atrás si existe.
		if (this.countdown) clearTimeout(this.countdown);

		this.socket = socket;

		// Detiene la ejecución del método si el total de terminales activas es inferior a 1.
		if (this.termstore.values.length < 1) return;

		// Vuelve a unir los eventos de todas las terminales.
		this.reBindEvents();
	}
}