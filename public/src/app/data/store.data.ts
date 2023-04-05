import { IndexedObject, WebTerminal, WebTerminalStore } from '../interfaces/pty.interface';
import { server } from '../interfaces/server.interface';
import { Terminal } from '../models/terminal.model';
import { WebsocketsService } from '../services/websockets.service';

class Stores {

	public socket: WebsocketsService | null;
	public terms = new Map<string, IndexedObject<WebTerminal>>()

	/**
	 * Limpia todas las referencias de los almacenes.
	 */
	public cleanUp() {
		this.terms.values()
		this.socket = null;
	}
	

}

export const stores = new Stores();