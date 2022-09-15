import { Router } from 'express';
import { ServersController } from '../../../controllers/auth/user/servers.controller';

export class ServersRouter {

	public router = Router();

	constructor() {

		this.router.get('/get');
		this.router.patch('/update');
		this.router.post('/new', ServersController.new);
		this.router.delete('/delete');

		this.router.get('/runSnippet');

	}
	
}