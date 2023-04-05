import { Subject } from 'rxjs';
import { IndexedObject, WebTerminal } from '../interfaces/pty.interface';

class TerminalStore {

	protected store = new Map<string, WebTerminal>();

	/**
	 * Almacén de terminales reflejado como array.\
	 * **Nota: Manipular su contenido no tendrá impacto alguno sobre el almacén.**
	 */
	public reflectedTerminalStoreArray: WebTerminal[] = [];

	/**
	 * Almacén de terminales en espera reflejado como array.
	 */
	public reflectedWaitingTerminalStoreArray: WebTerminal[] = [];

	/**
	 * Observable del almacén.\
	 * Devuelve un nuevo almacén reflejado en cada evento. 
	 */
	public $observableStore: Subject<WebTerminal[]> = new Subject();

	constructor() {
		this.$observableStore.next([]);
		console.log(this.$observableStore)
	}

	/**
	 * Obtiene una terminal por su identificador.
	 * @param pid Identificador de terminal
	 */
	public get(pid: string): WebTerminal | undefined {
		return this.store.get(pid);
	}

	/**
	 * Establece una terminal en el almacén o la sobreescribe si ya existía.
	 * @param pid Idenfitficador de terminal.
	 * @param terminal Terminal a insertar en el almacén.
	 */
	public set(pid: string, terminal: WebTerminal): void {

		// Si no se ha definido un pid o una terminal, se detiene la ejecución.
		if (!pid || !terminal) return;

		// Establece la terminal.
		this.store.set(pid, terminal);

		// Vuelve a construir el reflejo del almacén.
		this.rebuildReflectedStore();

	}

	/**
	 * Elimina una terminal del almacén.
	 * @param pid Identificador de terminal.
	 */
	public delete(pid: string): boolean {

		// Elimina del almacén la terminal indicada y reconstruye el reflejo si esta se ha eliminado.
		if (this.store.delete(pid)) {
			this.rebuildReflectedStore();
			return true;
		};

		return false;

	}

	/** Recorre todo el almacén de terminales. */
	public forEach(callbackfn: (value: WebTerminal, key: string) => void): void {

		// Llama al método forEach del almacén (envoltura).
		this.store.forEach(callbackfn);

		// Reconstruye los almacenes reflejados.
		this.rebuildReflectedStore();
		
	}

	/**
	 * Limpia todo el almacén de terminales.
	 */
	public clear() {
		this.forEach(t => {
			if (t.terminal) t.terminal.dispose();
		})
		this.store.clear();
		
		this.reflectedTerminalStoreArray = [];
		this.reflectedWaitingTerminalStoreArray = [];
	}

	/**
	 * Reconstruye el reflejo del almacén.
	 */
	private rebuildReflectedStore() {

		const waitings: WebTerminal[] = [];

		// Vuelca todo el almacén a un array y lo asigna a la representación como array.
		this.reflectedTerminalStoreArray = Array.from(this.store).map(([k, v]) => {
			// Además, por cada iteración, comprueba si la terminal está en estado de espera.
			if (v.connection.status === 'waiting') waitings.push(v);
			return v
		});

		// Reasigna las terminales en estado de espera.
		this.reflectedWaitingTerminalStoreArray = waitings;
		this.$observableStore.next(this.reflectedTerminalStoreArray);

	}

	public filterTerminalByServer(host: string) {
		return this.reflectedTerminalStoreArray.filter(term => {
			if (term.connection.host === host) return term;
		})
	}

}

/**
 * Almacén de terminales.
 */
export const terminalStore = new TerminalStore();