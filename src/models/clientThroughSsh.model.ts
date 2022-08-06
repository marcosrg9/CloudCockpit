import { Socket } from 'socket.io';
import { servers, users } from '../db/servers.db';
import { sizeParams, SshClient } from './ssh.model';


export class ClientThroughSsh {

	/** Almacena las terminales en un mapa identificado por los identificadores de procesos (pids) */
	private ptyStore: { pid: number, server: number, pty: SshClient }[] = [];

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
		this.socket.on('getServers', this.getServers.bind(this))

		// Evento de petición de nueva terminal.
		this.socket.on('open', this.openTerminal.bind(this))

		// Evento de petición de destrucción de terminal.
		this.socket.on('kill', this.killTerminal.bind(this))

		// Evento de petición de inserción de datos en el prompt de la terminal.
		this.socket.on('write', this.write.bind(this))
		
		// Evento de redimensionado del viewport de la terminal.
		this.socket.on('resize', this.resize.bind(this))

		// Evento de petición de datos de terminales.
		this.socket.on('getPtys', this.getPtys.bind(this))

		// Evento de desconexión del cliente.
		this.socket.on('disconnect', this.disconnect.bind(this))

	}

	private getServers() {

		const data = servers.map((server) => {

			const { id, host, port, name, snippets, webApps, authId, icon, wolPort, MAC } = server;

			return {
				id,
				host,
				port,
				name,
				allowWol: (wolPort && MAC) ? true : false,
				snippets,
				webApps,
				authId,
				icon
			}

		})

		this.socket.emit('serversData', data);

	}

	/**
	 * Crea una nueva terminal.
	 */
	private openTerminal(server: number, size: sizeParams) {

		const serverData = servers.find(data => data.id === server);

		if (!serverData) return this.socket.emit('connectionError', { msg: 'Servidor desconocido' })
		
		const user = users.find(user => user.id === serverData.authId);
		
		if (!user) return this.socket.emit('connectionError', { msg: 'Usuario desconocido' })


		// Crea la terminal.
		const pty = new SshClient({
			username: user.username,
			password: user.password,
			host: serverData.host
		}, size);

		pty.connect()
		.then(stream => {

			// Pseudo pid
			const pPid = Math.random();

			this.ptyStore.push({
				pid: pPid,
				server,
				pty
			});

			this.socket.emit('openTerminal', pPid);



			stream.on('data', ((data: ArrayBuffer) => {
				this.socket.emit('data', {
					pid: pPid,
					server: serverData.id,
					data: data
				})
			}))

			stream.on('close', () => {
				this.socket.emit('exit', pPid);
			})

		})
		.catch(err => {
			this.socket.emit('connectionError', err);
		})
	}

	/**
	 * Destruye una terminal por su pid.
	 * @param pid Identificador de proceso
	 */
	private killTerminal(pid: number, server: number) {

		const pty = this.ptyStore.find(pty => pty.pid === pid && pty.server === server);

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
		this.ptyStore.forEach((pty, pid) => pids.push(pid))

		// Devuelve los datos al cliente mediante el callback.
		cb(pids);
	}

	/**
	 * Inserta datos en el prompt del terminal dado un pid.
	 * @param data Datos del prompt para insertar en la terminal.
	 */
	private write(data: { pid: number, server: number, data: string}) {

		// Obtiene la terminal del almacén por su pid.
		const pty = this.ptyStore.find(pty => pty.pid === data.pid && pty.server === data.server);

		// Inserta los datos en la terminal si existe.
		if (pty) pty.pty.write(data.data, false);
	}

	/**
	 * Redimesiona todas las terminales.
	 * @param params Parámetros de dimesiones.
	 */
	private resize(params: sizeParams) {
		
		this.ptyStore.forEach(pty => { pty.pty.resize(params) })
		
	}

	/**
	 * Se encarga de manejar el evento de desconexión del cliente o servidor (si corresponde)
	 * @param reason Razón de desconexión del socket.
	 */
	private disconnect(reason: string) {

			//TODO: mantener las terminales vivas durante un periodo de tiempo según la razón de desconexión.
			// Nota: asignar un identificador de sesión al cliente para reconocer el socket.

			// Cierra las terminales en 5 minutos.
			this.countdown = setTimeout(() => {

			}, 300000)

			// Recorre el almacén de terminales.
			this.ptyStore.forEach((pty, _) => {

				// Mata los procesos de las terminales.
				pty.pty.kill();

			})
	}

	/**
	 * Vuelve a unir los eventos de un socket antiguo con el nuevo sin tener que destruir las terminales.
	 */
	private reBindEvents() {

		// Recorre el mapa de terminales.
		this.ptyStore.forEach((pty, _) => {
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
		if (this.ptyStore.values.length < 1) return;

		// Vuelve a unir los eventos de todas las terminales.
		this.reBindEvents();
	}
}