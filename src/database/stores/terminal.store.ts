import { logger } from '../../models/logger.model';
import { SshClient } from '../../models/ssh.model';
import { Terminal } from '../../models/terminal.model';
import { User } from '../../models/user.model';

export class TerminalStore {

	/** Contador de destrucción para terminales no conectadas (en segundos). */
	private destroyCountdown = 300;

	/** Mapa que contiene todas las terminales. */
	private store: Map<string, Terminal> = new Map();

	/** Almacena de forma temporal las conexiones no iniciadas. */
	private waitingForConnect = [];

	/** Contiene el contador para la destrucción de instancias de conexiones no iniciadas. */
	private destroyTimer: NodeJS.Timer | null;

	public size: number = 0;

	/**
	 * Almacén de instancias de terminales en memoria.
	 * @param user Instancia del usuario en la memoria.
	 */
	constructor(user: User) { }

	/**
	 * Establece una nueva terminal en el almacén.
	 * @param pid Identificador de la terminal.
	 * @param term Terminal.
	 */
	public set(pid: string, term: Terminal) {
		
		// Establece la terminal en el mapa con el pid obtenido.
		this.store.set(pid, term);
		this.size = this.store.size;

		// Comprueba si la terminal está esperando una conexión.
		if (term.status === 'waiting') {

			// Añade un identificador de terminal al almacén temporal.
			this.waitingForConnect.push(pid);

			// Activa el destructor de terminales.
			this.setDestroyTimer();

		}

	}

	/**
	 * Obtiene una terminal desde el almacén.
	 * @param pid Identificador de terminal.
	 */
	public get(pid: string): Terminal | undefined { return this.store.get(pid); }

	/**
	 * Elimina una terminal del almacén.
	 * @param pid Identificador de terminal.
	 */
	public delete(pid: string): void {

		// Elimina del almacén la terminal.
		const deletion = this.store.delete(pid);

		// Si la operación de borrado no ha encontrado la terminal lo añade al log.
		if (!deletion) logger.warning('terminalStore', `Deleting terminal (${pid}) that does not exists in the store.`);

		this.size = this.store.size;
		// Si el array de terminales en estado de espera contiene el pid.
		if (this.waitingForConnect.includes(pid)) {

			// Elimina el índice del pid.
			this.waitingForConnect.splice(this.waitingForConnect.indexOf(pid), 1);

			// Si no quedan más terminales en estado de espera, detiene el contador.
			if (this.waitingForConnect.length < 1) {
				clearInterval(this.destroyTimer)
			};

		}
	}

	/**
	 * Recorre todas las terminales del almacén.
	 */
	public forEach(callbackfn: (value: Terminal, key: string) => void): void { this.store.forEach(callbackfn) }

	/** Establece el contador de destrucción de terminales si no existe. */
	private setDestroyTimer() {

		// Si el contador ya existe se detiene.
		if (this.destroyTimer) return;

		// Declara la fecha actual.
		const currentDate = new Date().getTime();

		this.destroyTimer = setInterval(() => {

			this.waitingForConnect.forEach((pid, i) => {

				// Obtiene la terminal.
				const term = this.get(pid);

				// Si la terminal ya no existe o su estado ya no es de espera, la elimina del almacén temporal. Además detiene la ejecución.
				if (!term || term.status !== 'waiting') return this.waitingForConnect.splice(i, 1);

				// Compara las fechas y las asigna a una constante.
				const diff = Math.round(Math.abs((term.at.getTime() - currentDate) / 1000))

				// Si la diferencia es mayor a la cuenta atrás, elimina del almacén la terminal.
				if (diff >= this.destroyCountdown) {
					this.delete(pid);
					this.waitingForConnect.splice(i, 1);
					logger.info('terminalStore', `Waiting for connection terminal (${pid}) auto destroyed after countdown (${diff})`);
				}

			})

		}, this.destroyCountdown * 1000)

	}

	public removeFromWaitings(pid: string) {
		const i = this.waitingForConnect.indexOf(pid);

		if (i < 0) return;
		this.waitingForConnect.splice(i, 1);
		
		// Si no quedan más terminales en estado de espera, detiene el contador.
		if (this.waitingForConnect.length < 1) {
			clearInterval(this.destroyTimer)
		};
	}
}