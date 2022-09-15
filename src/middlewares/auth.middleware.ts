import { NextFunction, Request, Response } from 'express';
import { users } from '../database/user.db';

export abstract class AuthMiddlewares {

	public static loggedIn(req: Request, res: Response, next: NextFunction) {

		if (req.session.auth) return next();
		else return next('Not logged in')

	}

	public static rejectIfNotLoggedIn(req: Request, res: Response, next: NextFunction) {

		if (req.session.auth) return next();
		else res.status(401).end();

	}

	public static rejectIfLoggedIn(req: Request, res: Response, next: NextFunction) {

		if (!req.session.auth) return next();
		
		const { password, ...r } = req.session.auth;

		res.send({...r})

	}

	/**
	 * Gestiona el primer registro de usuario.
	 * Si la base de datos de usuarios está vacía, permite registrar sin haber iniciado sesión.
	 */
	public static handletFirstSignUp(req: Request, res: Response, next: NextFunction) {

		// Si la petición incluye un campo de rol, lo elimina.
		if (req.body.role) delete req.body.role;

		users.getRecordsCount()
		.then(count => {
			if (count < 1) next()
			else res.sendStatus(400);
		})

	}

	public static isAdminUser(req: Request, res: Response, next: NextFunction) {

		if (req.session.auth.role) next()
		else res.sendStatus(403);

	}

	public static checkIfCredentialsExists(req: Request, res: Response, next: NextFunction) {

		// Obtiene las credenciales del cuerpo.
		const { user, password } = req.body;

		if (!user || !password) res.status(400).end('Credentials missing');
		else next();

	}

}