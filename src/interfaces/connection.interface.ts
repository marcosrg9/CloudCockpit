import { minimalIdentify } from '../../public/src/app/interfaces/pty.interface';
import { sizeParams } from '../models/ssh.model';

export interface newConnection extends incommingConnection { size: sizeParams }

/** El cliente ha solicitado una conexión con un servidor. */
export interface incommingConnection {

	/** Identificador del host. */
	host: string;
	/** Identificador de credenciales. */
	auth: string;
	
}

/** La conexión ha sido recibida por el servidor y la está procesando. */
export interface processingConnection extends incommingConnection {
	
	/** Estado de la conexión. */
	status:		'connecting' | 'connected' | 'error';
	/** Marca de tiempo de solicitud. */
	at: 		Date;
	/** Datos resueltos por el servidor. */
	resolved: {
		/** Dirección del host. */
		host: 	string;
		/** Nombre de usuario de la credencial. */
		user: 	string;
		/** Puerto de conexión. */
		port?: 	string;
	};

}

/**
 * La petición ha sido recibida por el servidor y la está procesando.
 */
export interface inProgressConnection extends processingConnection {

	/** Estableciendo conexión. */
	status: 	'connecting';

}

/**
 * El servidor se ha conectado exitosamente con el servidor SSH.
 */
export interface successfulConnection extends processingConnection {

	status: 	'connected';
	/** Identificador de la terminal. */
	pid:		string;

}

export interface writeEvent extends incommingConnection {

	pid: string;
	/** Datos provenientes de la terminal. */
	data: string;

}

export interface resizeEvent extends minimalIdentify { size: sizeParams }

/**
 * El servidor no ha logrado conectarse al servidor SSH.
 */
export interface connectionError extends processingConnection {

	status: 	'error';
	/** Detalles del error. */
	error: 		sshLibErr

}

export interface sshLibErr {
	address:	string;
	code:		string;
	errno:		number;
	level:		number;
	port:		number;
	syscall:	string;
}