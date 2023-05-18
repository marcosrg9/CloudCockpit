import Express, { Router } from 'express';
import { cwd } from 'process';

export class StaticRouter {

	public router = Router();

	constructor() {

		// Sirve los ficheros estáticos.
		this.router.use('/', Express.static(cwd() + '/src/static'));

		// Acceso a las rutas de Angular desde cualquier otro punto de la app.
		this.router.get('*', function(req,res) {
			res.sendFile(cwd() + '/src/static/index.html');
		});
	}

}