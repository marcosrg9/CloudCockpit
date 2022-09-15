import { Terminal } from '../models/terminal.model';
import { incommingConnection as iC, processingConnection as pC, inProgressConnection as ipC, successfulConnection as sC } from '../../../../src/interfaces/connection.interface'

export type terminalType = incommingConnection | processingConnection | inProgressConnection | successfulConnection;

/** Datos de la terminal. */
export interface withTerminalData {

	/** Instancia de la terminal. */
	terminal: Terminal;
	/** Contenedor de la terminal. */
	element: HTMLDivElement;
	/** Indicador de foco. */
	focus?: boolean;
	/** Historial temporal. */
	history?: string;

}

export interface minimalIdentify {

	host: string;
	auth: string
	pid?: string;

}

/**
 * Conexión solicitada por el cliente.
 * Se trata de un objeto simple, no contiene la instancia de la terminal ni su contenedor.
 */
export interface incommingConnection extends iC {

	/** Indica si la terminal tiene el foco. */
	focus: boolean;
	/** Historial temporal. */
	history?: string;
}

/**
 * El servidor ha recibido la conexión y la está procesando.
 * Incluye instancia de terminal.
 */
export interface processingConnection extends pC, withTerminalData { }

/**
 * El servidor se está conectando con el servidor SSH.
 */
export interface inProgressConnection extends ipC, withTerminalData  { }

/**
 * El servidor ha logrado conectarse correctamente al servidor SSH.
 */
export interface successfulConnection extends sC, withTerminalData { }











// TODO: Eliminar esto.
export interface pty {
	
	/** Dirección del servidor. */
	server?: string;

	/** Identificador del servidor. */
	serverId: string;

	/** Nombre de la cuenta de usuario. */
	auth?: string;

	/** Identificador de credencial. */
	authId: string;
	
	/** Identificador de proceso. */
	pid?: string;

	/** Puerto de conexión. */
	port?: string;

	/** Instancia de la terminal. */
	terminal?: Terminal;

	/** Referencia del elemento HTML. */
	element?: HTMLDivElement;

	/** Historial del terminal. */
	history?: string;

	/** Indicador de foco de terminal. */
	focus?: boolean;

}

export interface completePty extends pty {

	server: string;

	serverId: string;
	pid: string;
	auth: string;
	port: string;
	terminal: Terminal;
	element: HTMLDivElement;
	focus: boolean
	
}

interface sshLibErr {
	address:	string;
	code:		string;
	errno:		number;
	level:		number;
	port:		number;
	syscall:	string;
}