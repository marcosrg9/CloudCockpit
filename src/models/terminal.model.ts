import { randomUUID } from 'crypto';
import { ClientChannel } from 'ssh2';
import { sizeParams, SshClient } from './ssh.model';
import { User } from './user.model';
import { terminalSizeParamsValidator } from '../validators/terminal.validator';
import { writeEvent } from '../interfaces/connection.interface';
import { connection } from '../interfaces/unifiedStructure.interface';

export class Terminal {

	/** Instancia de la conexión al servidor. */
	public connection: SshClient;

	/** Identificador de conexión. */
	public readonly pid: string = randomUUID();

	/** Instancia del flujo de datos. */
	private stream: ClientChannel;

	/** Estado actual de la conexión. */
	private _status: connection['status'] = 'waiting';

	/** Fecha en la que se abrió la conexión. */
	private _at = new Date();

	/**
	 * Buffer de la terminal.
	 * Contiene un máximo de 500 líneas.
	*/
	private _buffer = '';

	/**
	 * Instancia una nueva terminal con los parámetros indicados.
	 * @param serverId Identificador del servidor.
	 * @param server Servidor al que conectar.
	 * @param port Puerto del servidor.
	 * @param user Usuario que instancia la terminal.
	 * @param authId Identificador de la cuenta de usuario.
	 * @param username Nombre de la cuenta de usuario.
	 * @param password Contraseña de la cuenta de usuario.
	 * @param sizeParams Parámetros de dimensiones.
	 */
	constructor(public readonly serverId: string,
				public readonly server: string,
				public readonly port: string | number,
				public readonly user: User,
				public readonly authId: string,
				public readonly username: string,
				public readonly password: string,
				public sizeParams?: sizeParams) {

		// Comprueba si los parámetros de dimesiones no han sido establecidos y asigna los predefinidos.
		if (!sizeParams) sizeParams = { cols: '80', rows: '120', height: '300', width: '200' };

		// Valida los datos de dimensiones.			
		const validate = terminalSizeParamsValidator.validate(sizeParams, { stripUnknown: true });

		// Si los datos de dimensiones contiene errores, se usan los datos por defecto.
		if (validate.error) sizeParams = { cols: '80', rows: '120', height: '300', width: '200' };

		// Reasigna el puerto si está vacío.
		if (port === '') port = 22;

		// Abre una nuevo conexión.
		this.connection = new SshClient({
			username: username,
			password: password,
			host: 	  server,
			port: 	  parseInt(port as string)
		})

	}

	/**
	 * Conecta con el servidor y abre un flujo de datos.
	 */
	public connect(): Promise<typeof this.pid> {

		if (this._status == 'connected') return Promise.resolve(this.pid);

		// Declara el estado.
		this._status = 'connecting';

		// Elimina del conjunto de espera.
		this.user.termStore.removeFromWaitings(this.pid);

		// Intenta conectarse al servidor SSH.
		return this.connection.connect()
		.then(stream => {

			// Asigna a la propiedad la instancia del flujo de datos.
			this.stream = stream;

			// Escucha los eventos.
			this.listenEvents();

			// Declara el estado.
			this._status = 'connected';

			// Añade la terminal al mapa.
			this.user.termStore.set(this.pid, this);

			// Devuelve una promesa resuelta.
			return Promise.resolve(this.pid);

		})
		// Catch no es necesario, se captura el evento de cierre y error.
	}

	/**
	 * Desconecta y cierra el flujo.
	 */
	public disconnect() {
		this.connection.close();
	}

	/**
	 * Escribe en el flujo de datos.
	 * */
	public write(data: string) {
		this.connection.write(data)
	};

	/**
	 * Cambia las dimensiones de la terminal.
	 * @param data Parámetros de dimensiones.
	 */
	public resize(data: sizeParams) {
		this.connection.resize(data);
		this.sizeParams = data;
	};

	/**
	 * Escucha los eventos provenientes del flujo de datos.
	 */
	private listenEvents() {

		// Evento de recepción de datos.
		this.stream.on('data', this.onData.bind(this));
		
		// Evento de error de conexión.
		this.stream.on('error', this.onError.bind(this));

		// Evento de salida de terminal.
		this.stream.once('exit', this.onceExit.bind(this));

		// Evento de cierre de conexión.
		this.stream.on('close', this.onceClose.bind(this));

	}

	/**
	 * Maneja el evento de recepción de datos de la terminal.
	 * @param data Datos provenientes del flujo de datos.
	 */
	private onData(data: ArrayBuffer) {

		// Descodifica el buffer del flujo.
		const buffer = Buffer.from(data).toString('utf-8')

		// Emite un mensaje de difusión a todos los usuarios.
		this.user.broadcast('terminalData', {
			pid: this.pid,
			host: this.serverId,
			auth: this.authId,
			data: buffer
		} as writeEvent)

		// Concatena el buffer.
		this._buffer += buffer;

		// Divide el buffer en saltos de línea.
		let splitter = this._buffer.split('\n');

		// Comprueba si el buffer tiene más de 500 índices
		if (splitter.length > 500) {

			// Recorta el buffer desde el final - 500 índices hasta el final.
			splitter = splitter.splice(splitter.length - 500, splitter.length);

			// Une todos los índices y los asigna al buffer.
			this._buffer = splitter.join('');

		}
	}

	/**
	 * Maneja el evento de error de conexión.
	 * @param error Error producido
	 */
	private onError(error: Error) {
		this.user.broadcast('terminalConnectionError', {
			host: this.server,
			user: this.username,
			pid: this.pid,
			error
		})
	}

	/**
	 * Maneja el evento de cierre del flujo.
	 */
	private onceClose() {
		this.onceExit()
	}

	/**
	 * Emite el evento de salida de la terminal.
	 * Se dispara cuando se corre el comando 'exit'.
	 */
	private onceExit() {

		// Emite el evento de salida.
		this.user.broadcast('terminalExit', {
			host: this.serverId,
			auth: this.authId,
			pid: this.pid
		})

		// Destruye la conexión.
		this.connection.close();
		
		// Elimina la terminal del almacén.
		this.user.getAllTerminals().delete(this.pid);

	}

	/**
	 * Fecha en la que se ha abierto la conexión.\
	 * **Propiedad getter**
	 * */
	get at() { return this._at }

	/**
	 * Estado de la conexión.\
	 * **Propiedad getter**
	 */
	get status() { return this._status }

	/**
	 * Almacenamiento en buffer.\
	 * Incorpora hasta 500 líneas.\
	 * **Propiedad getter**
	 */
	get buffer() { return this._buffer }
	
}