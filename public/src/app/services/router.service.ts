import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouterService {

  private route: ActivatedRoute;
  private router: Router;

  constructor() { }

  public listenRouterParams(route: ActivatedRoute, router: Router) {
    if (!this.route || this.router) {
      this.route = route;
      this.router = router;
    } else return;

  }

  public getAllRouteParams(route: ActivatedRoute): any {
    let params = route.snapshot.params;
    let paramMap: {[k: string]: {}} = {};
    for (let key in params) {
      paramMap[key] = params[key];
    }
    let parentRoute = route.parent;
    while (parentRoute) {
      let parentParams = parentRoute.snapshot.params;
      for (let key in parentParams) {
        paramMap[key] = parentParams[key];
      }
      parentRoute = parentRoute.parent;
    }
    return paramMap;
  }
  
}
