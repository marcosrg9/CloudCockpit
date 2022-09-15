import { AfterContentChecked, Component, HostListener, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SeqParser } from 'src/app/models/sequenceParser.model';
import { incommingConnection, pty, successfulConnection } from 'src/app/interfaces/pty.interface';
import { ServersService } from 'src/app/services/servers.service';
import { TerminalService } from 'src/app/services/terminal.service';

/*
	Flujo de instanciación

	1. Nuevo elemento div (añadir a un array y usar ngFor), incluir la directiva de inicialización.
	   Nota: Añadir como atributo el id del servidor al elemento.
	2. Terminal (el servicio se encarga de esto).
	3. Ajustar dimensiones de la terminal al contenedor superior (padre - div).
	4. Emisión de evento de nueva terminal, añadir el id del servidor como parámetro.
	   Nota: indicar al método del servicio cuál es la terminal.
	5. Al recibir datos, escribir en la terminal correspondiente dichos datos.

	Nota: este flujo está adaptado a las condiciones de instanciación de la terminal.
	      Si la conexión se crea antes que la terminal, el servidor SSH no tendrá las dimensiones
		  correctas y los datos no se mostrarán ajustados al conetenedor.

	Nota: el método clear de xterm no funciona correctamente, además, al insertar los datos del
		  BehaviorSubject devuelve el último flujo de datos, no todo el historial, por lo que
		  los datos anteriores se pierden. El buffer no se almacena.
	
	He realizado varias pruebas y esta es la forma más óptima.
*/

@Component({
	selector: 'app-terms',
	templateUrl: './terms.component.html',
	styleUrls: ['./terms.component.css', './xterm.theme.css'],
  })
  export class TermsComponent implements AfterContentChecked, OnDestroy {

	/** Define las pestañas de terminales. */
	public tabs: incommingConnection | successfulConnection[] = [];

	constructor(public terms: TerminalService,
				public servers: ServersService,
				public router: Router) {

		// Navega al componente principal si no hay terminales pendientes de instanciación ni ya instanciadas.
		if (terms.pending.length < 1 && terms.terms.length < 1) router.navigate(['/main'])

		// Asigna el foco automáticamente si solo hay una terminal.
		if (this.terms.terms.length === 1) this.terms.terms[0].focus = true;
	}

	/**
	 * Se ejecuta cuando se ha cargado la vista.
	 * Este es el momento para insertar las terminales en el array.
	 */
	ngAfterContentChecked(): void {

		// Comprueba si hay una instanciación pendiente.
		if (this.terms.pending.length > 0) {

			// Recorre las terminales pendientes de instanciar.
			this.terms.pending.forEach((term, index) => {
				this.terms.terms.push({ host: term.host, auth: term.auth, focus: true } as incommingConnection)
				this.terms.pending.splice(index, 1);
			})
		}
	}

	/**
	 * Maneja el evento de pulsación de teclas.
	 * @param ev Evento del teclado.
	 */
	@HostListener('window:keydown', ['$event'])
	public onKeyDown(ev: KeyboardEvent) {

		//this.terms.write(ev);

	}

	@HostListener('window:resize', ['$event'])
	private resize(ev: Event) {
		
		this.terms.resize();

	}

	ngOnDestroy(): void {
		this.terms.removeWriteEvents();
	}
  }