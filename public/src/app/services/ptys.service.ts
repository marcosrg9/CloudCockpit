import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Terminal } from '../models/terminal.model';
import { WebsocketsService } from './websockets.service';

export interface pty {
	
	/** Identificador del servidor. */
	server: number;

	/** Identificador de proceso. */
	pid?: number;

	/** Instancia de la terminal. */
	terminal?: Terminal;

	/** Indicador de foco de terminal. */
	focus?: boolean;

}

export interface completePty extends pty {

	server: number;
	pid: number;
	terminal: Terminal;
	focus: boolean
	
}

@Injectable({
  providedIn: 'root'
})
export class PtysService {

	/** Conexiones abiertas */
	public ptys: (pty|completePty)[] = [];

	/** Propiedad que indica si hay una conexión pendiente de apertura. */
	public pending: number | null;

	constructor(private socket: WebsocketsService,
				private router: Router) {

		// Escucha el evento de inserción de datos.
		this.socket.on('data', this.onWriteHandler.bind(this));

		// Escucha el evento de desconexión.
		this.socket.on('kill', this.onDisconnectHandler.bind(this));

	}

	/**
	 * Abre una nueva conexión.
	 * @param server Identificador del servidor.
	 * @param element Elemento HTML que va a contener la terminal.
	 */
	public connect(server: number, element: HTMLDivElement) {

		return new Promise<number>((resolve, reject) => {

			// Crea una nueva instancia de la terminal.
			const terminal = new Terminal();
	
			// Vincula la terminal al elemento div.
			terminal.open(element);

			// Ajusta la terminal.
			terminal.fitAddon.fit();

			// Prepara los parámetros de dimensiones.
			const size = {
				cols: terminal.cols,
				rows: terminal.rows,
				width: element.clientWidth,
				height: element.clientHeight
			}
			
			// Espera al evento de apertura de terminal.
			this.socket.once('openTerminal', (pid: number) => {
	
				// Elimina el oyente de eventos de error de conexión.
				this.socket.removeAllListeners('connectionError');
	
				// Busca la terminal sin pid
				const pty = this.ptys.find(pty => pty.server === server && !pty.pid);

				if (pty) {
					
					// Quita el foco a todas las terminales.
					this.blurAll();

					// Asigna los datos necesarios.
					pty.pid = pid;
					pty.terminal = terminal;
					pty.focus = true;
		
					// Devuelve el identificador del proceso.
					resolve(pty.pid);

				}
	
			});
			
			// Espera al evento de error de conexión.
			this.socket.once('connectionError', (err: any) => {
				// Elimina el oyente de eventos de apertura de terminal.
				this.socket.removeAllListeners('openTerminal');
	
				// Provisional. Manejar el error.
				console.error(err);

				reject(err);
	
			});
	
			// Punto 5 del flujo.
			// Emite el evento de nueva conexión a un servidor.
			this.socket.emit('open', server, size);

		})


	}

	/**
	 * Mata una terminal enviando el evento de desconexión.
	 * @param server Identificador del servidor.
	 * @param pid Identificador de proceso.
	 */
	public disconnect(server: number, pid: number) {

		// Emite el evento de desconexión.
		this.socket.emit('kill', pid, server);

		// El método onDisconnectHandler se lanza cuando el servidor responde.

	}

	/**
	 * Maneja el evento de escritura de datos.
	 * @param data Datos requeridos para encontrar la terminal y los datos a insertar.
	 */
	private onWriteHandler(data: { server: number, pid: number, data: string }) {

		// Busca la terminal a la que le corresponde los datos.
		const pty: completePty = this.ptys.find(pty => pty.server === data.server && pty.pid === data.pid) as completePty;

		// Comprueba que se haya encontrado la terminal.
		if (pty) {

			// Un pequeño parche para caracteres extraños en zsh (al menos en mi ordenador).
			if (data.data.includes('[A$<2>')) data.data = data.data.replace('[A$<2>', '');

			// Escribe los datos en la terminal.
			pty.terminal.write(data.data);

		}

	}

	private onDisconnectHandler(server: number, pid: number) {

		// Recorre el array de terminales.
		for (let i = 0; i < this.ptys.length; i++) {

			// Selecciona la terminal de la iteración actual.
			const pty = this.ptys[i] as completePty;
			
			// Comprueba si la terminal de la iteración es correcta.
			if (pty.server === server && pty.pid === pid) {

				// Desactiva la terminal.
				pty.terminal.dispose();

				// Elimina la terminal del array.
				this.ptys.splice(i, 1);

				// Filtra las terminales conectadas.
				const completePtys = this.ptys.filter(pty => pty.pid && pty.server);

				// Comprueba que exista la primera terminal y le pone el foco.
				if (completePtys[0]) completePtys[0].focus = true;
				// No existen más terminales, se navega al componente principal.
				else this.router.navigate(['/main']);

				// Detiene la ejecución del bucle.
				break;

			}
		}

	}

	/**
	 * Escribe datos en la terminal (en el servidor, no en la instancia).
	 * @param data Cadena a introducir en la terminal.
	 */
	public write(data: string) {

		// Busca la terminal que tiene el foco.
		const pty = this.ptys.find(pty => pty.focus);

		// Comprueba si ha encontrado la terminal.
		if (pty) {

			// Desestructura las propiedades requeridas.
			const { server, pid } = pty;

			// Emite el evento con los datos.
			this.socket.emit('write', { server, pid, data });

		}

	}

	/**
	 * Pone el foco en una terminal.
	 * @param server Identificador del servidor.
	 * @param pid Identificador de proceso.
	 */
	public focus(server: number, pid: number) {

		// Busca la terminal correspondiente a los datos.
		const pty = this.ptys.find(pty => pty.server === server && pty.pid === pid);

		// Comprueba que la terminal exista.
		if (pty) {

			// Quita el foco a todas las terminales.
			this.blurAll();

			// Activa el foco a la terminal seleccionada.
			pty.focus = true;

		}

	}

	/**
	 * Quita el foco a todas las terminales.
	 */
	private blurAll() {
		// Recorre el array y establece por cada terminal la propiedad foco en falso.
		this.ptys.forEach(pty => pty.focus = false);
	}

	/**
	 * Ajusta el tamaño de la terminal y obtiene parámetros para enviarlos al servidor.
	 * @param terminal Terminal de la que obtener parámetros de dimensión.
	 */
	public resize(terminal?: Terminal) {

		const pty = this.getFocusedPty() as completePty;

		if (pty && pty.pid) {

			pty.terminal.fitAddon.fit();

			// Espera un poco a que la terminal se haya ajustado al contenedor.
			// Cutre pero no hay otra forma más elegante.
			setTimeout(() => {

				// Obtiene los parámetros de dimensiones.
				const { cols, rows, element } = pty.terminal;
				const { clientWidth: width, clientHeight: height } = element as HTMLDivElement;
		
				// Emite el evento de redimensionado.
				this.socket.emit('resize', { cols, rows, width, height });

			}, 100);

		}

		return;
		/* // Ajusta las dimensiones de la terminal.
		terminal.fitAddon.fit();

		// Espera un poco a que la terminal se haya ajustado al contenedor.
		// Cutre pero no hay otra forma más elegante.
		setTimeout(() => {

			// Obtiene los parámetros de dimensiones.
			const { cols, rows, element } = terminal;
			const { clientWidth: width, clientHeight: height } = element as HTMLDivElement;
	
			// Emite el evento de redimensionado.
			this.socket.emit('resize', { cols, rows, width, height });

		}, 100); */

	}

	/**
	 * Filtra las terminales con el identificador del servidor indicado.
	 * @param server Identificador del servidor.
	 */
	public filterPtysByServer(server: number): pty[] {

		// Devuelve las terminales filtradas.
		return this.ptys.filter(pty => pty.server === server);

	}

	/**
	 * Busca la terminal que tenga el foco.
	 */
	public getFocusedPty(): pty {

		// Busca y devuelve la terminal con el foco.
		return this.ptys.find(pty => pty.focus) as pty;

	}

	/**
	 * Indica si una terminal dada tiene el foco.
	 * @param pty Terminal
	 */
	public haveFocus(pty: pty) {

		// Comprueba si existe el pid
		if (pty.pid && pty.server) {

			// Obtiene la terminal con el foco.
			const focused = this.getFocusedPty();

			// Comprueba que se haya encontrado la terminal con el foco.
			if (focused) {

				if (focused.server === pty.server && focused.pid === pty.pid) return true
				else return false;

			} else return false;

		} else return false;

	}

	/**
	 * Vuelve a enlazar las terminales existentes con los contenedores correspondientes.
	 * @param server Identificador del servidor.
	 * @param pid Identificador de proceso.
	 * @param element Contenedor.
	 */
	public reBindTerminal(server: number, pid: number, element: HTMLDivElement) {

		// Busca la terminal correspondiente.
		const pty = this.ptys.find(pty => pty.server === server && pty.pid === pid) as completePty;

		// Comprueba que la terminal se ha encontrado.
		if (pty) {

			// Abre la terminal en el elemento.
			pty.terminal.open(element);

		}

	}

}