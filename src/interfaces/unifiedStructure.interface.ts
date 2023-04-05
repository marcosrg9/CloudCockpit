/*
 * Interfaces de terminales unificadas.
 * Se deben usar tanto en el backend como en el frontend
 * para mantener la consistencia de las estructuras de datos.
 */

import { sizeParams } from '../models/ssh.model'

/**
 * Interfaz de sesión ssh.
 */
export interface SshSession {
	/** Identificador del host. */
	host: string
	/** Identificador de credenciales. */
	auth: string | {
		username: string
		password: string
	}
	/** Estado de la conexión. */
	status:	'waiting' | 'connecting' | 'connected' | 'error'
	/** Buffer. */
	history: string,
	/** Identificador de la terminal. */
	pid: string
	/** Marca de tiempo de solicitud. */
	at: Date
	/** Datos resueltos por el servidor. */
	resolved: {
		/** Dirección del host. */
		host: 	string
		/** Nombre de usuario de la credencial. */
		user: 	string
		/** Puerto de conexión. */
		port?: 	string
	}
}

/**
 * Apertura de conexión a servidor ssh en estado de espera.
 */
export interface WaitingSshSession extends SshSession {
	status: 'waiting'
}

/**
 * Conexión al servidor ssh inciada.
 */
export interface ConnectingSshSession extends SshSession {
	status: 'connecting'
}

/**
 * Conexión con el servidor ssh establecida.\
 * El flujo entre el servidor ssh y CloudCockpit está abierto.
 */
export interface ConnectedSshSession extends SshSession {
	status: 'connected'
}

/**
 * Determina si un objeto de conexión es de tipo WaitingSshSession.
 * @param con Objeto de conexión
 * @returns boolean
 */
export const isWaiting = (con: connection): con is WaitingSshSession => con.status === 'waiting';

/**
 * Determina si un objeto de conexión es de tipo ConnectingSshSession.
 * @param con Objeto de conexión
 * @returns boolean
*/
export const isConnecting = (con: connection): con is ConnectingSshSession => con.status === 'connecting';

/**
 * Determina si un objeto de conexión es de tipo ConnectedSshSession.
 * @param con Objeto de conexión
 * @returns boolean
 */
export const isConnected = (con: connection): con is ConnectedSshSession => con.status === 'connected';

export type connection =  ConnectedSshSession | WaitingSshSession | ConnectingSshSession;

export interface openConnection {
	pid: SshSession['pid']
	size: sizeParams
}

export interface writeEvent extends SshSession {

	pid: string;
	/** Datos provenientes de la terminal. */
	data: string;
}

export interface connectionError extends SshSession {

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