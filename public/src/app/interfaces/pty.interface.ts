import { Terminal } from '../models/terminal.model';
import { ConnectedSshSession, ConnectingSshSession, connection, SshSession, WaitingSshSession } from '../../../../src/interfaces/unifiedStructure.interface'

/** 7 de Enero de 2023 */

/**
 * Terminal del lado del cliente.
 */
export interface AbstractWebTerm {

	terminal?: Terminal;
	element?: HTMLDivElement;
	focus?: boolean;
	connection: connection
}

export interface WaitingWebTerminal extends AbstractWebTerm {
	connection: WaitingSshSession
}

export interface ConnectingWebTerminal extends AbstractWebTerm {
	connection: ConnectingSshSession
}

export interface ConnectedWebTerminal extends AbstractWebTerm {
	connection: ConnectedSshSession
}

export type WebTerminal = (ConnectedWebTerminal | WaitingWebTerminal | ConnectingWebTerminal);

export type IndexedObject<T> = { [ key: string ]: T };

export type WebTerminalStore = Map<string, IndexedObject<WaitingWebTerminal | ConnectingWebTerminal | ConnectedWebTerminal>>;

export type manualAuth = {
	username: string,
	password: string
}

export type minimalIdentification = {
	host: WebTerminal['connection']['host']
	auth: WebTerminal['connection']['auth'] | manualAuth
	pid?: ConnectedWebTerminal['connection']['pid']
}

/**
 * Determina si un objeto es de tipo ConnectedWebTerminal
 * @param term Terminal a comprobar
 * @returns Booleano que determina si el objeto es de tipo ConnectedWebTerminal
 */
export const isConnectedWebTerm = (term: WebTerminal): term is ConnectedWebTerminal => {
	return term.connection.status === 'connected';
}

/**
 * Determina si un objeto es de tipo WaitingWebTerminal
 * @param term Terminal a comprobar
 * @returns Booleano que determina si el objeto es de tipo WaitingWebTerminal
 */
export const isWaitingWebTerm = (term: WebTerminal): term is WaitingWebTerminal => {
	return term.connection.status === 'waiting';
}

/**
 * Determina si un objeto es de tipo ConnectingWebTerminal
 * @param term Terminal a comprobar
 * @returns Booleano que determina si el objeto es de tipo ConnectingWebTerminal
 */
export const isConnectingWebTerm = (term: WebTerminal): term is ConnectingWebTerminal => {
	return term.connection.status === 'connecting';
}

interface sshLibErr {
	address:	string;
	code:		string;
	errno:		number;
	level:		number;
	port:		number;
	syscall:	string;
}