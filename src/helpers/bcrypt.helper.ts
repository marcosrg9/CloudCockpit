import { compare, genSalt, hash } from 'bcryptjs';

/**
 * Hashea una contraseña.
 * @param password Contraseña
 */
export const hashPassword = async(password: string) => {

	// Genera una sal.
	const salt = await genSalt();

	// Devuelve la función de hash.
	return await hash(password, salt)

}

/**
 * Compara dos cadenas y comprueba si son las mismas.
 * @param password Contraseña.
 * @param hash Contraseña con la que se desea comparar.
 */
export const comparePasswords = (password: string, hash: string) => {

	return compare(password, hash)
	.then(a => {

		// Rechaza la promesa si devuelve false.
		if (!a) return Promise.reject();

		// Resuelve la promesa si no ha devuelto false.
		return Promise.resolve();
		
	})
	.catch(err => {
		// Rechaza la promesa en caso de error.
		return Promise.reject(err);
	})
	
}