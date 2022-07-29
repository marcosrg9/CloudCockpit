import { platform } from 'os';
import { spawn } from 'node-pty';
import { Server } from './src/models/server.model';

new Server()

if (platform() === 'win32') {

} else {

}

/* const pty = spawn(process.env.SHELL || 'bash', [], {
	name: 'Terminal',
	cols: 80,
	rows: 30,
	cwd: process.env.HOME
})

pty.resume();

pty.on('data', function(data) {
	process.stdout.write(data);
})

pty.write('ssh 192.168.1.2\r'); */
/* pty.write('ls\r');
pty.resize(100, 40);
pty.write('ls\r'); */