import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { pty, PtysService } from 'src/app/services/ptys.service';
import { server, ServersService } from 'src/app/services/servers.service';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css']
})
export class ServerComponent implements OnInit {

  public server: server;
  public openedPtys: pty[] = [];

  constructor(private route: ActivatedRoute,
              private router: Router,
              public servers: ServersService,
              private ptys: PtysService) { }

  ngOnInit(): void {
    this.route.params.subscribe(data => {
      const server = this.servers.servers.find(a => a.id === parseInt(data['server']));

      if (!server) this.router.navigate(['main'])
      else {
        this.server = server;
        this.openedPtys = this.ptys.filterPtysByServer(this.server.id);
      }
    })
  }

  public openTerminal() {
    this.ptys.pending = this.server.id;
    this.router.navigate(['/main/terms']);
  }

}
