import { server } from './server.interface';

export interface primaryCommand {
	/** Nombre de la acción. */
	title: string
	/** Descripción de la acción. Retirar si no es necesario. */
	description?: string
	/** Callback. */
	action: Function
	/** Atajo de teclado (si existe). */
	shortcut?: string[]
	/** Solo para usuarios con privilegios. */
	privilegeRequired?: true
}

export interface serverCommand extends Omit<primaryCommand, 'shortcut'> {

	icon?: string
	requirements?: (arg0: server) => boolean

}

export interface serverCmdCollection {

	/** Datos del servidor. */
	server: server
	/** Acciones disponibles para el servidor. */
	actions: serverCommand[]

}

export interface abstractFilterCollectionType {
	type: 'global' | 'servers' | 'admin' | 'developer'
	collection: primaryCommand[] | serverCmdCollection[]
}

export type filteredActions = globalFilterCollectionType |
							  serversFilterCollectionType |
							  //adminFilterCollectionType |
							  developerFilterCollectionType

export interface globalFilterCollectionType extends abstractFilterCollectionType {
	type: 'global'
	collection: primaryCommand[]
}

export interface serversFilterCollectionType extends abstractFilterCollectionType {
	type: 'servers'
	collection: serverCmdCollection[]
}

export interface adminFilterCollectionType extends abstractFilterCollectionType {
	type: 'admin'
	collection: primaryCommand[];
}

export interface developerFilterCollectionType extends abstractFilterCollectionType {
	type: 'developer',
	collection: primaryCommand[];
}

// @ts-ignore -> Implementar esto, puede ser útil en un futuro...
export interface mixedFilterCollectionType extends abstractFilterCollectionType {
	type: 'mixed',
	collection: primaryCommand[];
}