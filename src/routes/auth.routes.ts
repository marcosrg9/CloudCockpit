import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddlewares } from '../middlewares/auth.middleware';
import { UserRouter } from './auth/user.routes';

export class AuthRouter {

	public router = Router();

	constructor() {

		this.router.use('/auth', [
			// Inicio de sesión
			this.router.post('/login', [
				AuthMiddlewares.rejectIfLoggedIn,
				AuthMiddlewares.checkIfCredentialsExists
			], AuthController.login),
			
			// Primer registro de usuario.
			this.router.post('/firstSignUp', [
				AuthMiddlewares.handletFirstSignUp
			], AuthController.signUp),

			// Recuperación de datos de sesión.
			this.router.get('/recoverSession', [
				AuthMiddlewares.rejectIfNotLoggedIn
			],
			AuthController.recoverSession),

			// Cierre de sesión
			this.router.get('/logout', [ AuthMiddlewares.rejectIfNotLoggedIn ], AuthController.logout),

			// Resto de rutas.
			this.router.use('/user', [ AuthMiddlewares.rejectIfNotLoggedIn ], new UserRouter().router)
		])

	}

}