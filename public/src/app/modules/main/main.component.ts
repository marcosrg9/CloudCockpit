import { AfterViewInit, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Terminal } from 'src/app/models/terminal.model';
import { AuthService } from 'src/app/services/auth.service';
import { PtysService } from 'src/app/services/ptys.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements AfterViewInit {

  @ViewChild('termCont') termRefs: ElementRef<HTMLDivElement>;

  public status = { sync: false }

  constructor(public ptys: PtysService,
              public auth: AuthService) { }

  ngAfterViewInit() { }

}
