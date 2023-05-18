import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setupWizard',
  templateUrl: './setupWizard.component.html',
  styleUrls: ['./setupWizard.component.css']
})
export class setupWizardComponent implements OnDestroy {

  public main: boolean = true;

  public $obs: Subscription;

  public status = {
    cypherKey: false
  }

  constructor(private router: Router,
              private route: ActivatedRoute,
              private http: HttpClient) {

    this.$obs = router.events.subscribe(a => {
      if (a instanceof NavigationEnd) {
        route.snapshot.children.length === 0 ? this.main = true : this.main = false;        
      }
    })

    this.http.get('/server/existsCypher', { responseType: 'text' })
    .subscribe({
      next: () => this.status.cypherKey = true
    })
  }

  ngOnDestroy(): void {
    this.$obs.unsubscribe();
  }

}
