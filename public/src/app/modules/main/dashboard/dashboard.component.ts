import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TerminalService } from 'src/app/services/terminal.service';
import { ServersService } from 'src/app/services/servers.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(public servers: ServersService,
              public terms: TerminalService,
              public router: Router) {

    this.servers.fetchAllServers();
    
  }

  ngOnInit(): void {
  }

  /**
   * Abre una sesión SSH de forma directa sin pasar por el panel de servidor.
   * @param server Identificador del servidor
   */
  public directConnect(server: string) {
    /* this.terms.pending = server; */
    //this.router.navigate(['main/terms'])
  }

}
