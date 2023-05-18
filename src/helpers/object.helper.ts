import mongodb from 'mongodb';
import { ObjectID } from 'typeorm'

/**
 * Obtiene los cambios entre dos objetos del mismo tipo y los une.
 * @param prev Objeto anterior (al que se le añadirán las propiedades actualizadas)
 * @param next Objeto posterior (del que se extraeran los cambios)
 * @param ignored Lista de claves ignoradas para comprobar.
 * @param clone Crea una copia de los objetos para prevenir la escritura en la misma referencia.
 */
export const mergeDiffProperties = (prev: any, next: any, ignored: string[] = [], clone: boolean = false) => {

	// Si el parámetro de clonación está activo.
	if (clone) {
		// Crea una nueva copia de los objetos.
		prev = structuredClone(prev);
		next = structuredClone(next);
	}

	// Recorre cada clave del objeto anterior.
	Object.keys(prev).forEach(k => {

		// Si la clave de la iteración no existe en la lista de ignorados y existe en el nuevo objeto.
		if (!ignored.includes(k) && next[k]) {

			// Si la clave asociada al valor del nuevo objeto se trata de un objeto.
			if (typeof next[k] === 'object' && !(next[k] instanceof ObjectID)) {
				// El valor de la clave del objeto anterior equivale al resultado de la fusión con la clave del nuevo objeto.
				prev[k] = mergeDiffProperties(prev[k], next[k])

			// Si el tipo del valor de la clave es una cadena.
			} else if (typeof next[k] === 'string') {
				// Si la longitud del nuevo valor es mayor a 0, la asigna.
				if (next[k].length > 0) prev[k] = next[k];

			// En cualquier otro caso, asigna el parámetro.
			} else prev[k] = next[k];

		}
	})

	// Devuelve el objeto anterior con las modificaciones del nuevo.
	return prev

}