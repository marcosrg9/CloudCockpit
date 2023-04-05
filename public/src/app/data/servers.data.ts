import { IndexedObject, WebTerminal } from '../interfaces/pty.interface';
import { server } from '../interfaces/server.interface'


class ServerStore {

	/** Almacén de servidores. */
	public servers: server[] = [];


}

export const serverStore = new ServerStore();