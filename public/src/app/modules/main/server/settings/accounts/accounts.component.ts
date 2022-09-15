import { Component, OnInit } from '@angular/core';
import { ServersService } from 'src/app/services/servers.service';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {

  constructor(public server: ServersService) { }

  ngOnInit(): void {
  }

}
