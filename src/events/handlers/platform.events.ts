import { Socket } from 'socket.io';
import { PlatformHelper } from '../../helpers/platform.helper';
import { AbstractSocket } from '../abstractSocket.events';

export class PlatformEvents extends AbstractSocket {

	constructor(private socket: Socket) {

		super(socket, ['getPlatformParams']);

		socket.on('getPlaformParams', this.onGetPlatformParams.bind(this));


	}

	private onGetPlatformParams() {

		this.socket.emit('platformParams', PlatformHelper.getPlatformDigest());

	}

}