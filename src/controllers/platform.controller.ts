import { platform, arch, cpus, version, freemem, totalmem, hostname, release } from 'os'
import { Request, Response } from 'express'
import { getClientIp } from 'request-ip'
import { main } from '../../main';

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

		const data = {
			platform: platform(),
			arch: arch(),
			version: version(),
			release: release(),
			memory: {
				free: freemem(),
				used: totalmem() - freemem(),
				total: totalmem(),
			},
			env: {
				overDocker: main.runningOverDocker,
				devEnv: process.env.NODE_ENV === 'dev' ? true : false,
			},
			host: hostname(),
			cpus: cpus(),
		};

		res.json(data);

	}

}