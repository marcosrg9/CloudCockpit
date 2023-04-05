import { stores } from 'src/app/data/store.data';
import { terminalStore } from 'src/app/data/terminal.store';
import { serverStore } from 'src/app/data/servers.data';
import { primaryCommand } from 'src/app/interfaces/filter.interface';

export const developerActions: primaryCommand[] = [
	/* {
		title: '[Platform] Navigate to developer playground',
		description: 'Go to the developer playground to run actions more quickly.',
		action: () => { }
	}, */
	{
		title: '[Client] Dump terminal store',
		description: 'Dump all terminal sessions in the web console.',
		action: () => {
			//@ts-ignore
			window.terms = terminalStore.reflectedTerminalStoreArray;
			console.log(terminalStore.reflectedTerminalStoreArray);
		}
	},
	{
		title: '[Client] Dump server store',
		description: 'Dump all server data in the web console.',
		action: () => {
			console.log(serverStore.servers);
		}
	},
	{
		title: '[Signal] Dump terminal stores (server-side)',
		description: 'Send a debug signal to dump terminal stores.',
		action: () => {
			stores.socket?.emit('dump:stores', 1)
		}
	},
	{
		title: '[Signal] Dump V8 heap memory (server-side)',
		description: 'Dump the V8 heap to inspect them.',
		action: () => { console.log('Dump all') }
	},
	{
		title: '[Signal] Emit arbitrary socket message',
		description: 'Emit a message from any channel to the server.',
		action: () => {}
	},
	{
		title: '[Rest]{POST} Send arbitrary request (custom)',
		description: 'Send POST requests arbitrarily from the client (this navigator).',
		action: () => {}
	},
	{
		title: '[Rest]{GET} Send arbitrary request (custom)',
		description: 'Send GET requests arbitrarily from the client (this navigator).',
		action: () => {}
	}
]