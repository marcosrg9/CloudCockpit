import { platform, arch, version, freemem, totalmem, hostname, release, cpus } from 'os';
import { groupedCpus } from '../interfaces/platform.interface';
import { main } from '../../main';
import { readFile, readFileSync } from 'fs';
import { cwd } from 'process';

export abstract class PlatformHelper {

	static getNodeMinVersion() {
		return readFileSync(cwd() + '/.node-version', { encoding: 'utf-8' });
	}

	/**
	 * Reescala una
	 * @param memory Capacidad de memoria
	 * @returns Capacidad de memoria seguida de la magnitud (p.e: ```16 GB```).
	 */
	static parseMemory(memory: number): string {

		let total = memory;
		let latest = 0;
		const mags = [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB' ]
		
		while (total >= 1024 && latest <= mags.length) {
			total /= 1024;
			latest++;
		}

		return `${total} ${mags[latest]}`;

	}

	static parseClockRate(rate: number): string {

		let total = rate;
		let latest = 0;
		const mags = [ 'Hz', 'MHz', 'KHz', 'GHz', 'THz', 'PHz', 'EHz', 'ZHz' ]

		while (total >= 10 && latest <= mags.length) {
			total = total / 10;
			latest++;
		}

		return `${total} ${mags[latest]}`;

	}

	static groupedSysCpu() {

		const processors: groupedCpus = {};
		
		cpus().forEach(cpu => {
			processors[cpu.model]
				? processors[cpu.model].cores++
				: processors[cpu.model] = { cores: 1, speed: PlatformHelper.parseClockRate(cpu.speed) }
		})

		return processors;

	}

	/**
	 * Prepara un resumen de parámetros y estado de la plataforma, además del hardware.
	 */
	static getPlatformDigest() {

		return {
			node: process.versions.node,
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
			cpus: this.groupedSysCpu(),
		};

	}

}