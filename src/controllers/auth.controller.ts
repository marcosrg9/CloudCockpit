import { Request, Response } from 'express';
import { TypeORMError } from 'typeorm';
import { platform } from '../database/platform.db';
import { sessionStore } from '../database/stores/session.store';
import { user, users } from '../database/user.db';
import { CypherError } from '../errors/cypher.error';
import { comparePasswords } from '../helpers/bcrypt.helper';
import { decrypt } from '../helpers/cypher.helper';
import { logger } from '../models/logger.model';

/*
	Gestión de terminales.
	Cuando el usuario inicia sesión pueden haber dos formas de gestionar las conexiones:

	1. Cada registro de usuario es almacenado en memoria, y cuando este abre una nueva terminal,
	se le asocia su id con un conjunto de terminales.
	Ventaja: el usuario tendrá la misma terminal abierta en cualquier dispositivo, de esta forma
	puede seguir trabajando desde cualquier dispositivo (Continuity)
*/
export abstract class AuthController {

	/**
	 * Inicia sesión.
	 */
	public static login(req: Request, res: Response) {

		// Extrae las credenciales del cuerpo.
		const { user, password } = req.body;

		// Busca el usuario en la base de datos.
		users.getUserByUsername(user)
		.then(async(user) => {

			// Comprueba si la contraseña ha sido cifrada.
			if (user.enc) {
				// Descifra la contraseña y la reasigna.
				user.password = await decrypt(user.password);
			}

			// Compara las contraseñas
			comparePasswords(password, user.password)
			.then(() => {

				// Establece el usuario en la sesión.
				req.session.auth = user;

				// Extrae la contraseña.
				const { password, ...r } = user;

				// Responde a la petición.
				res.send(r)

				// Establece la sesión en el almacén de sesiones.
				sessionStore.setRecord(req.session.id);

			})
			.catch(err => {

				// Si el error está vacío significa que las contraseñas no coinciden.
				if (!err) res.status(404).send('User or password wrong...')
				else res.status(500).send(err);

			})

		})
		.catch((err) => {
			
			/* if (err instanceof MongoError) {

				// Comprueba si la conexión con la base de datos no está disponible.
				if (err.reason && err.reason.error.name === 'MongoNetworkError') return res.status(503).send('Database connection lost');
				if (err.message.includes('connect ECONNREFUSED')) return res.status(503).send('Database unavailable')
				return res.status(500).send('Database driver error');
				
			} */

			if (err instanceof CypherError) {
				logger.error('login@AuthController', err.message, err)
				return res.status(500).send('Login failed');
			}

			if (err instanceof TypeORMError) {

				// El usuario no se ha encontrado.
				if (err.name === 'EntityNotFoundError') return res.status(404).send('User or password wrong...')
				else return res.status(500).send(err);

			}

		})

	}

	/**
	 * Recupera una sesión de usuario enviando los datos.
	 */
	public static recoverSession(req: Request, res: Response) {

		users.getRecordById(req.session.auth._id.toString())
		.then(data => {
			
			// Extrae la contraseña del usuario.
			const { password, ...r } = data;

			// Envía la información al usuario.
			res.send(r);

		})
		.catch(err => {

			// Se ha producido un error desconocido, eliminando la sesión.
			req.session.destroy(() => {});

			// Informa al usuario.
			res.status(500).send(err)
			
		})

	}

	/**
	 * Registra un usuario en el sistema.
	 */
	public static async signUp(req: Request, res: Response) {

		try {
			
			// Extrae los parámetros del usuario.
			const { user, password } = req.body;
			let role: user['role'] = req.body.role;

			// Obtiene el recuento de usuarios.
			const count = await users.getRecordsCount();

			// Define el rol si no se ha definido y el recuento de usuarios es inferior a 1.
			// Esto significa que es el primer registro.
			if (count < 1) role = 'admin';
			if (!role) role = 'standard';
	
			// Crea el usuario.
			users.createUser({ username: user, password, role })
			.then(() => {

				// Responde al usuario.
				res.sendStatus(200);

				// Inicializa la plataforma.
				if (count < 1) platform.initialize();

			})
			.catch((err) => {
				res.status(500).send(err);
			})

		} catch (error) {
			res.status(500).send(error);
		}

	}

	/**
	 * Destruye la sesión del usuario.
	 */
	public static logout(req: Request, res: Response) {

		// Destruye la sesión.
		sessionStore.destroy(req.sessionID)
		.finally(() => {
			
			// Finaliza la petición.
			res.end();

		})
		

	}

}