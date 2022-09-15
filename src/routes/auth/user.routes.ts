import { Router } from 'express';
import { ServersRouter } from './user/servers.routes';

export class UserRouter {

	public router = Router();

	constructor() {

		this.router.use('/servers', new ServersRouter().router)


	}
	
}