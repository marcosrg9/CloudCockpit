import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { TerminalService } from 'src/app/services/terminal.service';
import { ServersService } from 'src/app/services/servers.service';
import { WebsocketsService } from 'src/app/services/websockets.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements AfterViewInit {

  @ViewChild('termCont') termRefs: ElementRef<HTMLDivElement>;

  public status = { sync: false }

  constructor(public terms: TerminalService,
              public auth: AuthService,
              public servers: ServersService,
              private sockets: WebsocketsService) {

    // Se conecta al servidor (si aún no lo había hecho).
    sockets.connect();

    // Descubre todas las terminales almacenadas en el servidor.
    this.terms.discover();
  }

  public getSessions() {
    this.sockets.once('openSessions', (data: any) => {
      console.log(data);
    })
    this.sockets.emit('getSessions')
  }

  public getSockets() {
    this.sockets.once('connectedSockets', (data: any) => {
      console.log(data);
    })
    this.sockets.emit('getSockets')
  }

  ngAfterViewInit() { }

}
