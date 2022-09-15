import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-setupWizard',
  templateUrl: './setupWizard.component.html',
  styleUrls: ['./setupWizard.component.css']
})
export class setupWizardComponent implements OnInit {

  public main: boolean = true;

  public status = {
    cypherKey: false
  }

  constructor(private router: Router,
              private route: ActivatedRoute) {

    router.events.subscribe(a => {
      if (a instanceof NavigationEnd) {
        route.snapshot.children.length === 0 ? this.main = true : this.main = false;        
      }
    })
  }

  ngOnInit(): void {
  }

}
