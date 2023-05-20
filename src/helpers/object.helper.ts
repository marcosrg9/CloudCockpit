import mongodb from 'mongodb';
import { ObjectID } from 'typeorm'

type mergeUpdateParams = {
	// Lista de claves que se ignorarán.
	ignored?: string[],
	// Lista de instancias que se ignorarán.
	ignoredInstances?: any[],
	// Realiza una clonación para crear nuevas referencias.
	clone?: boolean,
	// Las cadenas deben tener una longitud mínima para no ser sobreescritas.
	stringMinLength?: number
}

// Placeholder para los parámetros de fusión.
const uP: mergeUpdateParams = {
	ignored: [],
	ignoredInstances: [],
	clone: false,
	stringMinLength: 0
}

/**
 * Obtiene los cambios entre dos objetos del mismo tipo y los une.
 * @param prev Objeto anterior (al que se le añadirán las propiedades actualizadas).
 * @param next Objeto posterior (del que se extraeran los cambios).
 * @param updateParams Parámetros de actualización del objeto anterior.
 */
export const mergeDiffProperties = (prev: any, next: any, updateParams: mergeUpdateParams = uP) => {

	// Asignaciones a indefinidos.
	updateParams.clone ||= false;
	updateParams.ignored ||= [];
	updateParams.ignoredInstances ||= [];
	updateParams.stringMinLength ||= 0;

	// Si el parámetro de clonación está activo.
	if (updateParams.clone) {
		// Crea una nueva copia de los objetos.
		prev = structuredClone(prev);
		next = structuredClone(next);
	}

	// Obtiene las claves del objeto anterior.
	const prevKeys = Object.keys(prev);

	// Fusión para claves que existen en el objeto anterior.
	for(let i = 0; i < prevKeys.length; i++) {

		// Obtiene la clave correspondiente a la iteración.
		const k = prevKeys[i];

		// Si la clave es ignorada o es instancia de una clase ignorada, continúa el bucle.
		if (updateParams.ignored.includes(k) || updateParams.ignoredInstances.some(v => prev[k] instanceof v)) {
			continue;

		// Si la clave no existe en el nuevo objeto, la elimina del anterior y continúa el bucle.
		} else if (!(k in next)) {
			delete prev[k];
			continue;
		
		// Si el tipo del valor es un objeto, y no es un array.
		} else if (typeof next[k] === 'object' && !(next[k] instanceof Array)) {
			prev[k] = mergeDiffProperties(prev[k], next[k], updateParams);
			continue;

		// Si el valor es una cadena.
		} else if (typeof next[k] === 'string') {
			// Si no cumple con los requisitos de longitud, lo reasigna.
			if (next[k].length < updateParams.stringMinLength) prev[k] = next[k]
			// En caso contrario, continúa el bucle.
			else continue;

		// Si el valor anterior es una instancia de array u ObjectId de Mongo.
		} else prev[k] = next[k];

	}

	// Fusión para claves que existen en el nuevo objeto.
	Object.keys(next).forEach(k => {
		
		// Cuando no exista una clave del nuevo objeto en el anterior, lo asignará.
		if (!(k in prev)) prev[k] = next[k];

	})

	// Devuelve el objeto anterior con las modificaciones del nuevo.
	return prev

}