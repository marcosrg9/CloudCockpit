import Express, { Router } from 'express';
import { cwd } from 'process';
import { parse, join } from 'node:path';

export class StaticRouter {

	public router = Router();

	private readonly staticDir = join(parse(__dirname).dir, 'static');

	constructor() {

		// Sirve los ficheros estáticos.
		this.router.use('/', Express.static(this.staticDir));

		// Acceso a las rutas de Angular desde cualquier otro punto de la app.
		this.router.get('*', (req,res) => {
			res.sendFile(join(this.staticDir, 'index.html'));
		});
	}

}