import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PtysService } from 'src/app/services/ptys.service';
import { ServersService } from 'src/app/services/servers.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(public servers: ServersService,
              public ptys: PtysService,
              public router: Router) { }

  ngOnInit(): void {
  }

  /**
   * Abre una sesión SSH de forma directa sin pasar por el panel de servidor.
   * @param server Identificador del servidor
   */
  public directConnect(server: number) {
    this.ptys.pending = server;
    this.router.navigate(['main/terms'])
  }

}
