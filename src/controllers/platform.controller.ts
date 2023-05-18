import { Request, Response } from 'express'
import { getClientIp } from 'request-ip'
import { PlatformHelper } from '../helpers/platform.helper';

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

	public static getPlatformDigest(req: Request, res: Response) {

		res.json(PlatformHelper.getPlatformDigest());

	}

}