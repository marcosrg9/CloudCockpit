import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { server } from 'src/app/interfaces/server.interface';
import { ServersService } from 'src/app/services/servers.service';
import { WebsocketsService } from 'src/app/services/websockets.service';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.css']
})
export class GeneralComponent {

  public server: server;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private servers: ServersService,
              private socket: WebsocketsService) {
    
    const server = this.servers.getServer(this.route.parent!.snapshot.params['server']);
    
    if (!server) this.router.navigate(['/main'])
    else this.server = server;
  }

}
