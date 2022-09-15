import { Router } from 'express'
import { ServerController } from '../controllers/server.controller';
import { userStore } from '../database/stores/user.store';
import { AuthMiddlewares } from '../middlewares/auth.middleware';

export class ServerRouter {

	public router = Router();

	constructor() {

		this.router.use('/server', [
			this.router.get('/initialized', ServerController.initialized),
			this.router.get('/existsCypher', ServerController.existsCypher),
			this.router.get('/terms', [ AuthMiddlewares.rejectIfNotLoggedIn ], (req, res) => {

				console.log(userStore.get(req.session.auth._id).getAllTerminals())

				res.end();

			}),
		])

	}
	
}