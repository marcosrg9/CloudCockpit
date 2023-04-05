import { Terminal as xterm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';


export class Terminal extends xterm {

	/** Addon de ajuste de dimensiones. */
	public fitAddon = new FitAddon();

	/** Addon de intrepretación de enlaces. */
	public linksAddon = new WebLinksAddon();

	constructor() {

		// Carga los datos preestablecidos.
		super({
			rendererType: 'dom',
			allowTransparency: true,
			cursorStyle: 'bar',
			cursorBlink: true,
			fontFamily: 'MesloLGS NF, Monaco, Monospace',
			fontSize: 16,
			theme: {
			  black: '#000000',
			  red: '#cd3131',
			  green: '#05bc79',
			  yellow: '#e5e512',
			  blue: '#2472c8',
			  magenta: '#bc3fbc',
			  cyan: '#0fa8cd',
			  white: '#e5e5e5',
			  brightBlack: '#666666',
			  brightRed: '#BE3F39',
			  brightGreen: '#05bc79',
			  brightYellow: '#e5e512',
			  brightBlue: '#2472c8',
			  brightMagenta: '#bc3fbc',
			  brightCyan: '#0fa8cd',
			  brightWhite: '#e5e5e5',
			  cursor: '#0080ff',
			  cursorAccent: '#00ff00',
			  selection: '#5a5c62',
			  selectionForeground: '#ece7e7',
			  //background: '#262a33',
			}
		});

		// Carga el addon de ajuste.
		this.loadAddon(this.fitAddon);

		// Carga el addon de enlaces.
		this.loadAddon(this.linksAddon);

		this.fitAddon.activate(this);
	}
}