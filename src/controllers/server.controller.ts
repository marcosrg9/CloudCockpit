import { Request, Response } from 'express';
import { platform } from '../database/platform.db';

export abstract class ServerController {

	/**
	 * Controlador para la ruta de comprobación de plataforma inicializada.
	 */
	public static initialized(req: Request, res: Response) {
		
		platform.getPlatformParams()
		.then(a => {
			if (a) res.sendStatus(200)
			else res.sendStatus(404)
		})
		.catch(err => {
			res.status(404).send(err)
		})

	}

	public static existsCypher(req: Request, res: Response) {

		const { DB_CYPH } = process.env;

		if (DB_CYPH && DB_CYPH.length === 32) {
			res.sendStatus(200);
		} else {
			res.sendStatus(404);
		}

	}
	

}