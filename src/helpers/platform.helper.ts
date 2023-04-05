import { totalmem } from 'os';

export abstract class PlatformHelper {

	static parseLastMagnitude(memory){

		let total = memory;
		let latest = 0;
		const mags = [ 'B', 'KB', 'MB', 'GB', 'TB' ]
		
		while (total > 1000) {
			total = total / 1024;
			latest++;
		}

		console.log(total, mags[latest]);

	}

}