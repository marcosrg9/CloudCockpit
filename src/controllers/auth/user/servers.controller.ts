import { Request, Response } from 'express';
import { TypeORMError } from 'typeorm';
import { servers, newServer } from '../../../database/servers.db';
import { serverValidator } from '../../../validators/server.validator';

export abstract class ServersController {

	public static new(req: Request, res: Response) {

		// Contiene los parámetros de la petición.
		const server = req.body;

		// Asigna el propietario al servidor.
		server.owner = req.session.auth._id;

		// Valida los parámetros del servidor.
		const validation = serverValidator.validate(server);

		// Si se ha producido un error de validación, se detiene la petición y se informa al usuario.
		if (validation.error) return res.status(400).json(validation.error);

		// Intenta crear el servidor.
		servers.createServer(validation.value as any)
		.then(() => {
			
			res.send()
			
		})
		.catch(err => {

			res.status(500).send(err)

		})
		
	}

}