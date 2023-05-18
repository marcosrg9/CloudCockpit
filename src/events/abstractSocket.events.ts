import { Socket } from 'socket.io';

export abstract class AbstractSocket {

	/**
	 * Abstracción de sockets.
	 * @param socket Socket del cliente.
	 * @param eventChannels Lista de nombre de los canales de eventos.
	 */
	constructor(private _socket: Socket,
				private _eventChannels: string[]) { }

	public removeAllListeners() {
		this._eventChannels.forEach(channel => {
			this._socket.removeAllListeners(channel)
		})
	}

}