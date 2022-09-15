import { Router } from 'express';
import { PlatformController } from '../controllers/platform.controller';
import { AuthMiddlewares } from '../middlewares/auth.middleware';

export class PlatformRouter {

	public router = Router();

	constructor() {

		this.router.use('/platform', [
			this.router.get('/gpip', [ AuthMiddlewares.rejectIfNotLoggedIn ], PlatformController.getPublicIP)
		])

	}

}