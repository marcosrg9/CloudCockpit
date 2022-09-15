/*
	Almacén unificado.
	Este concepto tiene un enfoque muchísimo más simple que la
	estructura usada.

	Todos los almacenes funcionan por separado, pero los modelos tienen
	un fuerte acople con el resto de los almacenes.

	Tal vez sea más sencillo encontrar registros en la unistore:
	
		uniStore.find((rec) => rec.session === '')
		uniStore.filter(rec => rec.user === '')

	Esto es solamente un concepto, llevo tiempo dudando sobre el
	rendimiento de CloudCockpit usando la arquitectura de almacenes.
*/

/** Registro del almacén unificado. */
export interface unifiedRecord {

	/** Identificador del usuario. */
	user: 		string;
	/** Identificador de sesión. */
	session: 	string;
	/** Identificador del socket. */
	socket?:	string;

}

export const uniStore: unifiedRecord[] = [];