import { Directive, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import { PtysService } from '../services/ptys.service';

@Directive({
  selector: '[appOnloadTerm]'
})
export class OnloadTermDirective implements AfterViewInit {

  constructor(private elementRef: ElementRef,
              private ptys: PtysService) { }
  
  /** Se ejecuta cuando se ha cargado el elemento HTML */
  ngAfterViewInit(): void {

    // Obtiene el elemento HTML.
    const element = this.elementRef.nativeElement as HTMLDivElement;

    // Comprueba si se trata de una terminal ya instanciada.
    const pid = element.attributes.getNamedItem('pid')?.value;

    // Obtiene el atributo de identificador del servidor.
    const server = parseInt(element.attributes.getNamedItem('server')!.value);

    // Existe un pid, por lo que se procede a revincular la terminal con el contenedor.
    if (pid && server && typeof server === 'number') {

      // Vuelve a enlazar la terminal.
      this.ptys.reBindTerminal(server, parseFloat(pid), element);

    } else {

      // Se trata de una terminal sin instanciar, procediendo con la ejecución habitual.
    
      // Comprueba que se haya interpretado correctamente el atributo.
      if (typeof server === 'number') {
  
        // Crea una conexión con los parámetros indicados.
        this.ptys.connect(server, element)
        .then(pid => {
          element.setAttribute('pid', pid.toString());
        })
        .catch(err => {
          console.error(err)
        })
  
      }

    }


  }
}
