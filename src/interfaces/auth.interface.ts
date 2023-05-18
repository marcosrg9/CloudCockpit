export type auth = {
	_id: string
	username: string
	description: string
}

export type authForClient = Omit<auth, 'password' | 'enc'>;

export type newAuthFromClient = Omit<authForClient, '_id'> & { password: string, server: string };

/**
 * Type guard para comprobar si una credencial es de tipo authForClient (que contiene el id),
 * o de tipo newAuthFromCient, que no contiene el id.
 * @param auth Credencial a comprobar para el tipo.
 */
export const isNewAuth = (auth: (authForClient | newAuthFromClient)): auth is newAuthFromClient => {
	if ('new' in auth) return true;
	return false;
}