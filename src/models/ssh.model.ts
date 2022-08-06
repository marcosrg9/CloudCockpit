import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { EventEmitter } from 'stream';

export interface sizeParams {

	/** Filas. */
	rows: string;
	/** Columnas. */
	cols: string;
	/** Alto del contenedor. */
	height: string;
	/** Ancho del contenedor. */
	width: string;

}

export class SshClient {

	/** Emisor de eventos del cliente. */
	public emitter = new EventEmitter();

	/** * Objeto de conexión al cliente. */
	private connection = new Client();

	/** Canal de comunicación con el cliente (stream). */
	private channel: ClientChannel;

	/**
	 * Crea una sesión de consola interactiva con el cliente a través de SSH.
	 * @param params Parámetros de conexión con el servidor.
	 */
	constructor(private params: ConnectConfig,
				private size?: sizeParams ) { }

	public connect(): Promise<ClientChannel> {

		return new Promise(async(resolve, reject) => {

			try {

				// Comprueba los parámetros
				await this.checkParams();
				
				// Escucha una vez el evento de conexión preparada.
				this.connection.once('ready', () => {
		
					// Abre la terminal.
					this.connection.shell((err, stream) => {

						// Establece los datos de dimensiones si existes.
						if (this.size) stream.setWindow(this.size.rows.toString(), this.size.cols.toString(), this.size.height.toString(), this.size.width.toString())

						// Define la codificación a UTF-8.
						stream.setEncoding('utf-8')
						
						// Si se produce un error, rechaza la promesa.
						if (err) reject(err);
						// Si no, la resuelve.
						else resolve(stream);
	
						// Define la propiedad con el objeto de flujo de datos.
						this.channel = stream;
					})
		
				})
				// Conecta usando los parámetros indicados.
				.connect(this.params)
				// Escucha el evento de error de conexión y rechaza la promesa si se lanza.
				.once('error', (err => { reject(err) }))

			} catch (error) {

				// Rechaza la promesa si checkParams devuelve error.
				reject(error);
				
			} 

		})
		
	}

	/**
	 * Comprueba si los parámetros son correctos.
	 */
	private checkParams() {

		return new Promise<void>((resolve, reject) => {

			const { username, password, host } = this.params;
	
			if (!username || typeof username !== 'string' || username.length < 1) reject('username');
			if (!password || typeof password !== 'string' || password.length < 1) reject('password');
			if (!host || typeof host !== 'string' || host.length < 1) reject('host');

			resolve();

		})
	}

	/**
	 * Inserta datos en el flujo de la terminal.
	 * @param data Cadena a introducir en la consola.
	 */
	public write(data: string, end = true) {

		// Comprueba si hay un canal de comunicación disponible, entonces escribe en él.
		if (this.channel) this.channel.write(data);

		// Comprueba si el el flujo de información debe acabar.
		if (end) this.channel.end();

		// Devuelve la instancia.
		return this
	}

	/**
	 * Finaliza la inserción de datos en la terminal.\
	 * ⚠️ No cierra el flujo de datos. Solamente finaliza la escritura.
	 */
	public end() { if (this.channel) this.channel.end() }

	/**
	 * Redimensiona la terminal.
	 * @param params Parámetros de dimensiones
	 */
	public resize(params: sizeParams) {

		if (!this.channel) return;
		
		const { cols, rows, height, width } = params;

		if (cols && rows && height && width) this.channel.setWindow(rows, cols, height, width)

	}

	/**
	 * Cierra la consola interactiva.
	 */
	public close() {

		// Comprueba si el canal no ha sido abierto.
		if (!this.channel) return;

		// Cierra el canal de comunicación.
		this.channel.close()

	}

	/**
	 * Cierra la consola interactiva (alias para close)
	 */
	public kill() { this.close() }

}