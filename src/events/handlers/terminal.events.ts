import { Socket } from 'socket.io';
import { userStore } from '../../database/stores/user.store';
import { minimalIdentification } from '../../../public/src/app/interfaces/pty.interface';
import { resizeEvent, writeEvent } from '../../interfaces/connection.interface';
import { AbstractSocket } from '../abstractSocket.events';

export class TerminalEvents extends AbstractSocket {

	private user: string;

	/**
	 * Controla los eventos relacionados con terminales.
	 * Se encarga de añadir y destruir los oyentes de eventos necesarios.
	 * @param socket Instancia del socket del usuario.
	 * */
	constructor(private socket: Socket) {

		super(socket, ['writeToTerm', 'resize', 'killTerminal']);
		this.user = socket.handshake.session.auth._id;

		this.listenEvents();

	}

	private listenEvents() {
		
		this.socket.on('writeToTerm', this.onWriteToTerm.bind(this));

		this.socket.on('resize', this.onResize.bind(this));

		this.socket.on('killTerminal', this.killTerminal.bind(this));

	}

	/**
	 * Escribe en la terminal indicada.
	 */
	private onWriteToTerm(data: writeEvent) {
		
		userStore.get(this.user).emitToTerm(data)
	}


	private onResize(data: resizeEvent) {

		const user = userStore.get(this.user);

		if (user) {
			user.getAllTerminals().forEach(term => term.resize(data.size))
		}
		
	}

	private killTerminal(data: minimalIdentification) {

		if (!data.pid) return;

		const user = userStore.get(this.user);
		
		if (user) {
			const terminal = user.getAllTerminals().get(data.pid);

			if (terminal) terminal.disconnect();
		}

	}

}