import { Directive, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { incommingConnection, inProgressConnection, successfulConnection } from '../interfaces/pty.interface';
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

		// Comprueba si se trata de una terminal ya instanciada.
		const pid = element.attributes.getNamedItem('pid')?.value;

		// Obtiene el atributo de identificador del servidor.
		const server = element.attributes.getNamedItem('server')!.value;

		// Obtiene el atributo de identificador del servidor.
		const auth = element.attributes.getNamedItem('auth')!.value;

		// Busca la terminal en la lista.
		const term = this.terms.findTerminal({ host: server, auth, pid }) as (successfulConnection | incommingConnection);

		// Comprueba que la terminal haya sido encontrada.
		if (!term) return console.log({ error: 'La terminal no ha sido encontrada', host: server, auth, pid, element });

		/**
		 * Cobertura
		 * 
		 * - Cuando el cliente instancia él mismo la terminal.
		 * - Cuando el servidor indica que hay una nueva terminal.
		 * - Cuando ya había una terminal pero no se había creado.
		 */

		// Es una terminal ya instanciada.
		if (term && 'terminal' in term) {
			
			// Revincula la terminal.
			this.terms.reBindTerminal(server, auth, pid!, element)

		} else {

			// Si incorpora pid o estado conectando, significa que ya ha sido creada en otro dispositivo.
			if ((term as successfulConnection).pid || (term as inProgressConnection).status === 'connecting') {
				
				// Revincula la terminal con el contenedor.
				this.terms.reBindTerminal(server, auth, pid!, element);
				
			// Es una terminal sin conectar.
			} else this.terms.attachAndConnect(server, auth, element);

		}


	}
}
