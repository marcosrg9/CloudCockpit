import { Socket } from 'socket.io';
import { Pty, size } from './pty2.model';

// TODO: Código muerto, eliminar.

export class Client {

	/** Almacena las terminales en un mapa identificado por los identificadores de procesos (pids) */
	private ptyStore: Map<number, Pty> = new Map();

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

		[
			'openTerminal',
			'killTerminal',
			'write',
			'resize',
			'getPtys',
			'disconnect'
		]

		// Evento de petición de nueva terminal.
		this.socket.on('openTerminal', this.openTerminal.bind(this))

		// Evento de petición de destrucción de terminal.
		this.socket.on('killTerminal', this.killTerminal.bind(this))

		// Evento de petición de inserción de datos en el prompt de la terminal.
		this.socket.on('write', this.write.bind(this))
		
		// Evento de redimensionado del viewport de la terminal.
		this.socket.on('resize', this.resize.bind(this))

		// Evento de petición de datos de terminales.
		this.socket.on('getPtys', this.getPtys.bind(this))

		// Evento de desconexión del cliente.
		this.socket.on('disconnect', this.disconnect.bind(this))

	}

	/**
	 * Crea una nueva terminal.
	 */
	private openTerminal(size: { cols: number, rows: number }) {

		// Crea la terminal.
		const pty = new Pty(size);

		// La asigna al mapa.
		this.ptyStore.set(pty.pid, pty);

		// Lanza el callback pasando el pid del proceso.
		this.socket.emit('openTerminal', pty.pid);

		// Escucha el evento de salida de datos desde la terminal y los envía al cliente.
		pty.on('data', (data) => this.socket.emit('data', {
			pid: pty.pid,
			data: data
		}));

		// Escucha el evento de salida de la terminal y la elimina del mapa.
		pty.on('exit', (data => {
			this.ptyStore.delete(pty.pid);

			// Avisa al cliente de que la terminal ha sido destruida.
			this.socket.emit('exit', pty.pid)
		}))
	}

	/**
	 * Destruye una terminal por su pid.
	 * @param pid Identificador de proceso
	 */
	private killTerminal(pid: number) {

		// Busca la instancia de la terminal en el mapa por el pid.
		const pidFromMap = this.ptyStore.get(pid);

		// Si existe la instancia, lanza el método de destrucción.
		if (pidFromMap) pidFromMap.kill();
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
	 * @param pid Pid del proceso del terminal.
	 */
	private write(data: string, pid: string) {

		// Pasa a tipo número el pid proveniente del socket (para prevenir).
		const pidAsNum = parseFloat(pid);

		// Detiene la ejecución del método si el pid interpretado no es un número.
		if (typeof pidAsNum !== 'number') return;

		// Obtiene la terminal del almacén por su pid.
		const pty = this.ptyStore.get(pidAsNum);

		// Inserta los datos en la terminal si existe.
		if (pty) pty.write(data);
	}

	/**
	 * Redimesiona todas las terminales.
	 * @param params Parámetros de dimesiones.
	 */
	private resize(params: size) {
		this.ptyStore.forEach((pty) => pty.resize(params) )
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
				pty.kill();
			})
	}

	/**
	 * Vuelve a unir los eventos de un socket antiguo con el nuevo sin tener que destruir las terminales.
	 * @param socket Nuevo socket del cliente.
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