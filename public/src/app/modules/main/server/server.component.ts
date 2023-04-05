import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

import { TerminalService } from 'src/app/services/terminal.service';
import { WebTerminal } from 'src/app/interfaces/pty.interface';
import { ServersService } from 'src/app/services/servers.service';
import { server } from '../../../interfaces/server.interface'
import { WebsocketsService } from 'src/app/services/websockets.service';
import { terminalStore } from 'src/app/data/terminal.store';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css']
})
export class ServerComponent implements OnInit, OnDestroy {

  /** Referencia del servidor actual. */
  public server: server;

  /** Terminales instanciadas al el servidor actual. */
  public terminals: WebTerminal[];

  /** Referencia del objeto location. */
  public location = location;

  /** Parámetros de estado. */
  public status = {
    showSelector: false,
    manualLogin: false
  }

  /** Observable de eventos del almacén de terminales. */
  private $reflectedStoreObserver: Subscription;

  @ViewChildren('manualUser') manualUser: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChildren('manualPass') manualPass: QueryList<ElementRef<HTMLInputElement>>;
  
  constructor(private route: ActivatedRoute,
              private router: Router,
              public servers: ServersService,
              private terms: TerminalService,
              private sockets: WebsocketsService) { }

  ngOnInit(): void {
    this.route.params.subscribe(data => {

      // Obtiene el último parámetro de la ruta.
      const param = data['server'];

      // Si no se encuentra el identificador del servidor, se vuelve al menú principal.
      if (!param) this.router.navigate(['main'])

      // Si no existe el array de servidores, significa que se acaba de cargar.
      if (!this.servers.servers) {

        // Escucha el evento de recepción de datos.
        this.sockets.once('serverData', () => {
          
          // Retrasa un milisegundo la comprobación (error, array de servidores indefinido).
          setTimeout(() => { this.findServerData(param) }, 1)

        })

        // Solicita la lista de servidores.
        this.servers.fetchAllServers();

      // Si ya existían los servidores, se filtra.
      } else this.findServerData(param)

    })
  }

  /**
   * Busca los datos de un servidor dado y los carga en la memoria.
   * @param id Identificador del servidor.¡
   */
  private findServerData(id: string) {

    // Obtiene el servidor del almacén de servidores.
    const server = this.servers.servers!.find(a => a._id === id);

    // Si no se ha encontrado el servidor, se vuelve a la página principal.
    if (!server) {
      console.log('No se ha encontrado datos de servidor');
      return this.router.navigate(['main'])
    }
    
    // Se subscribe al observable del almacén reflejado y asigna la subscripción.
    this.$reflectedStoreObserver = terminalStore.$observableStore.subscribe((next) => {

      // En cada evento, se filtran las terminales abiertas para este servidor.
      this.terminals = terminalStore.filterTerminalByServer(server._id);

      console.log(server)

      // Se asigna el servidor.
      this.server = server;

    })

    terminalStore.$observableStore.next([]);

  }

  /**
   * Abre una nueva terminal con las credenciales especificadas.
   * @param auth Credenciales de conexión.
   */
  public openTerminal(auth?: string) {

    if (!this.server.auths || this.server.auths.length < 1) return this.status.manualLogin = true;

    // Si el servidor tiene más de una credencial y no se ha especificado ninguna, muestra el selector.
    if (!auth && this.server.auths.length > 1) return this.status.showSelector = true;

    // Si no se ha especificado ninguna credencial y existen menos de 2 (solo 1), se asigna.
    if (!auth || this.server.auths.length < 2) auth = this.server.auths[0]._id;

    // Prepara la terminal.
    this.terms.prepareTerminal(this.server._id, auth)
    .then(() => {
      // Navega al visor de terminales.
      this.router.navigate(['/main/terms'])
    })
  }

  public manualLogin() {
    const { value: username } = this.manualUser.first.nativeElement;
    const { value: password } = this.manualPass.first.nativeElement;

    if (username.length > 0 && password.length > 0) {
      this.terms.prepareTerminal(this.server._id, { username, password })
      .then(() => {
        this.router.navigate(['/main/terms'])
      })
    }
  }

  ngOnDestroy(): void {
    if (this.$reflectedStoreObserver) {
      // Cierra la subscripción para liberar memoria.
      this.$reflectedStoreObserver.unsubscribe();
    }
  }

}
