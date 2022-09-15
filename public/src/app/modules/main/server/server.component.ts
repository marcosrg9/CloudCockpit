import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TerminalService } from 'src/app/services/terminal.service';
import { pty, successfulConnection } from 'src/app/interfaces/pty.interface';
import { ServersService } from 'src/app/services/servers.service';
import { server } from '../../../interfaces/server.interface'
import { WebsocketsService } from 'src/app/services/websockets.service';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css']
})
export class ServerComponent implements OnInit {

  public server: server;
  public openedPtys: successfulConnection[] = [];

  public location = location;

  public status = {
    showSelector: false
  }

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

  private findServerData(id: string) {

    const server = this.servers.servers!.find(a => a._id === id);

    if (!server) this.router.navigate(['main'])
    else {
      this.server = server;
      this.openedPtys = this.terms.filterPtysByServer(this.server._id) as successfulConnection[];
    }

  }

  /**
   * Abre una nueva terminal con las credenciales especificadas.
   * @param credential Credenciales de conexión.
   */
  public openTerminal(credential?: string) {

    // Si el servidor tiene más de una credencial y no se ha especificado ninguna, muestra el selector.
    if (this.server.auths.length > 1 && !credential) return this.status.showSelector = true;

    // Si no se ha especificado ninguna credencial y existen menos de 2 (solo 1), se asigna.
    if (!credential && this.server.auths.length < 2) credential = this.server.auths[0]._id;

    // Se añade al conjunto de terminales pendientes de instanciar.
    this.terms.addPendingInit({
      host: this.server._id,
      auth: credential as string
    })

    // Navega al visor de terminales.
    this.router.navigate(['/main/terms']);
  }

}
