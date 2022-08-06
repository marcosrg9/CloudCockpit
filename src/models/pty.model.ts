import { IPty, spawn } from 'node-pty';
import { Socket } from 'socket.io';

// TODO: Código muerto, eliminar.

export class PtySession {

	public pty: IPty;

	constructor(private socket: Socket) {

		this.pty = spawn(process.env.SHELL || 'bash', [], {
			name: 'Terminal',
			cols: 100,
			rows: 150,
			cwd: process.env.HOME,
			//@ts-ignore
			env: process.env
		})

		this.pty.onData(data => {
			this.socket.emit('data', data);
		})

		this.pty.onExit(e => {
			this.socket.emit('kill', e)
		})

		this.socket.on('write', data => {			
			this.pty.write(data)
		})

		this.socket.on('resize', (data: {cols: number, rows: number}) => {
			this.pty.resize(data.cols, data.rows)
		})

		this.socket.on('kill', () => {
			this.pty.kill();
		})

		this.socket.on('disconnect', () => {
			this.pty.kill();
		})

	}

	public write(data: string) {
		this.pty.write(data);
	}

	public kill() {
		this.pty.kill('1');
	}
	
	public get pid(): number {
		return this.pty.pid;
	}
	

}