import { Directive, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
//import { incommingConnection, inProgressConnection, processingConnection, successfulConnection } from '../interfaces/pty.interface';
import { WaitingSshSession, ConnectingSshSession, ConnectedSshSession } from '../../../../src/interfaces/unifiedStructure.interface'
import { TerminalService } from '../services/terminal.service';

/*
	Esta directiva permite lanzar el evento de apertura únicamente cuando la terminal
	está preparada.
	
	En el caso de no existir esta directiva, las terminales no tendría parámetros de dimensiones
	iniciales, por lo que el servidor no podrá renderizar correctamente el contenido.
*/

@Directive({
selector: '[appOnloadTerm]'
})
export class OnloadTermDirective implements AfterViewInit {

	constructor(private elementRef: ElementRef,
				private terms: TerminalService) { }

	/** Se ejecuta cuando se ha cargado el elemento HTML */
	ngAfterViewInit(): void {

		// Obtiene el elemento HTML.
		const element = this.elementRef.nativeElement as HTMLDivElement;

		// Obtiene el atributo de identificación de terminal.
		const pid = element.attributes.getNamedItem('pid')!.value;

		// Obtiene el atributo de identificación del servidor.
		const host = element.attributes.getNamedItem('host')!.value;

		// Obtiene el atributo de identificación del servidor.
		const auth = element.attributes.getNamedItem('auth')!.value;

		// Busca la terminal en la lista.
		const term = this.terms.findTerminal(pid);

		//TODO: La está buscando en el array reflejado de estado de espera...??
		// Comprueba si la terminal no ha sido encontrada.
		if (!term) {
			return console.log({ error: 'La terminal no ha sido encontrada', host, auth, pid, element });
		}

		// Reenlaza la conexión con la terminal.
		if (term.connection.status !== 'waiting') return this.terms.bindTerminal(host, auth, pid, element);
		else this.terms.attachAndConnect(pid, element);

	}
}
