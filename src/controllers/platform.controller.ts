import { Request, Response } from 'express'
import { getClientIp } from 'request-ip'


export abstract class PlatformController {

	/**
	 * Obtiene la dirección IP pública del cliente.
	 */
	public static getPublicIP(req: Request, res: Response) {

		const ip = getClientIp(req);

		if (!ip) return res.status(404).end();
		res.setHeader('content-type', 'text/plain')
		return res.send(ip);
		
	}

}