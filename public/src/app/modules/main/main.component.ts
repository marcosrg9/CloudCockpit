import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { TerminalService } from 'src/app/services/terminal.service';
import { ServersService } from 'src/app/services/servers.service';
import { WebsocketsService } from 'src/app/services/websockets.service';
import { statusAndParams } from 'src/app/data/statuses.data';
import { AuthStore } from 'src/app/data/auth.data';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements AfterViewInit {

  @ViewChild('termCont') termRefs: ElementRef<HTMLDivElement>;

  public darkmode: boolean;

  public status = statusAndParams;

  constructor(public terms: TerminalService,
              public auth: AuthService,
              public servers: ServersService,
              private sockets: WebsocketsService) {

    // Se conecta al servidor (si aún no lo había hecho).
    sockets.connect();

    // Inicializa el almacén de crendeciales.
    new AuthStore(this.sockets);

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
    this.status.globalVisibility.userMenu = !this.status.globalVisibility.userMenu;
  }

  public toggleCmdPalette() {
    // Simula un nextTick. El cmdp detecta el evento click fuera de él y se cierra.
    setTimeout(() => {
      this.status.globalVisibility.userMenu = false;
      console.log(this.status.commandPaletteVisibility);
      
      this.status.commandPaletteVisibility = !this.status.commandPaletteVisibility;
    }, 0)
    
  }

  public emit(channel: string, message: string) {
    this.sockets.emit(channel, message);
  }

  ngAfterViewInit() { }

}
