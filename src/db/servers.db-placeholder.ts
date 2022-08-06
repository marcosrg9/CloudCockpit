interface server {
	id: 		number,
	name: 		string,
	host: 		string,
	port: 		number,
	authId: 	number,
	MAC?: 		string,
	wolPort?: 	number,
	icon?: 		string,
	metal?:		boolean,
	snippets?: { name: string, command: string }[],
	webApps?: { name: string, url: string }[]
}


// TODO: Provisional, crear una base de datos
export const servers = [
	{ 
		id: 1,
		name: 'MacBook Pro',
		host: '192.168.1.3',
		port: 22,
		icon: 'apple',
		authId: 1
	},
	{
		id: 2,
		name: 'Tesla',
		host: '192.168.1.2',
		port: 22,
		MAC: 'FF:FF:FF:FF:FF:FF',
		wolPort: 9,
		icon: 'windows',
		authId: 2,
		snippets: [
			{ name: 'Hibernar', command: 'shutdown -h' },
		],
		webApps: [
			{ name: 'Code Server', url: 'http://192.168.1.2' },
			{ name: 'Oracle APEX', url: 'http://192.168.1.2:8240' },
			{ name: 'Servidor Web', url: 'http://192.168.1.2:80' },
		]
	},
]

export const users = [
	{
		id: 1,
		username: '',
		password: '',
		description: ''
	},
	{
		id: 2,
		username: '',
		password: '',
		description: ''
	}
]