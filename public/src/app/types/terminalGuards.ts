import { incommingConnection, inProgressConnection, processingConnection, successfulConnection } from '../interfaces/pty.interface';

export const isIncommingConnection = (v: incommingConnection): v is incommingConnection => 'host' in v && 'auth' in v;

export const isProcessingConnection = (v: processingConnection): v is processingConnection => {

	if ('status' in v && 'at' in v && 'resolved' in v) {

		if ('host' in v && 'user' in v) return true
		else return false;

	} else return false;

}

export const isInProgressConnection = (v: inProgressConnection): v is inProgressConnection => {

	if (isProcessingConnection(v)) {

		if (v.status === 'connecting') return true
		else return false;
		
	} else return false;

}

export const isSuccessfulConnection = (v: successfulConnection): v is successfulConnection => {

	if (isProcessingConnection(v)) {

		if (v.status === 'connected') return true
		else return false;
		
	} else return false;

}