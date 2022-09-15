import { Request, Response, NextFunction } from 'express';
import { sessionStore } from '../database/stores/session.store';

/**
 * Intercepta una petición para comprobar si existe una sesión en el almacén correspondiente
 * al id asignado a la cookie.
 */
export const sessionInterceptor = (req: Request, res: Response, next: NextFunction) => {

	// Comprueba que existan las credenciales en la sesión.
	if (req.session.auth) {
		
		// Obtiene el registro de la sesión del almacén.
		const session = sessionStore.getRecord(req.session.id);

		// Si la sesión no existe, la inserta en el almacén.
		if (!session) sessionStore.setRecord(req.session.id);

	}

	// Continúa con el flujo normal después de todo el proceso.
	next();

}