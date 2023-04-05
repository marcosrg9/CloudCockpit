import { serverCommand } from 'src/app/interfaces/filter.interface'
import { server } from 'src/app/interfaces/server.interface'

export const serverActions: serverCommand[] = [

	{
		title: 'cmd_server_title_wol',
		description: 'cmd_server_description_wol',
		icon: 'asFnt_power',
		action: (() => {}),
		requirements: ((server: server) => Boolean(server.MAC))
	},
	{
		title: 'cmd_server_title_new_ssh_session',
		description: 'cmd_server_description_new_ssh_session',
		icon: 'asBase64_terminal',
		action: (() => {}),
	},
	{
		title: 'cmd_server_title_exec',
		description: 'cmd_server_description_exec',
		icon: 'asBase64_terminal',
		action: (() => {}),
	},
	{
		title: 'cmd_server_title_run_snippet',
		description: 'cmd_server_description_run_snippet',
		icon: 'asBase64_terminal',
		action: (() => {}),
	},

]