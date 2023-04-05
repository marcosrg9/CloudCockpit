import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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

  public darkmode: boolean;

  public status = {
    sync: false,
    commandPalette: false,
    navbarHdr: false
  }

  constructor(public terms: TerminalService,
              public auth: AuthService,
              public servers: ServersService,
              private sockets: WebsocketsService) {

    // Se conecta al servidor (si aún no lo había hecho).
    sockets.connect();

    // Descubre todas las terminales almacenadas en el servidor.
    this.terms.discover();

    window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      this.darkmode = e.matches;
    })
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

  @HostListener('window:keydown', ['$event'])
  private onKeyDown(event: KeyboardEvent) {

    const { metaKey, ctrlKey, key } = event;
    
    
    if ((metaKey || ctrlKey) && key.toLowerCase() === 'p') {
      this.toggleCmdPalette();
      event.preventDefault();
    }

  }

  public toggleNavbarHdr() {
    this.status.navbarHdr = !this.status.navbarHdr;
  }

  public toggleCmdPalette() {
    // Simula un nextTick. El cmdp detecta el evento click fuera de él y se cierra.
    setTimeout(() => {
      this.status.navbarHdr = false;
      console.log(this.status.commandPalette);
      
      this.status.commandPalette = !this.status.commandPalette;
    }, 0)
    
  }

  ngAfterViewInit() { }

}
