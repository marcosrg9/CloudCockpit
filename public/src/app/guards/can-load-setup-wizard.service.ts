import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanLoadSetupWizardService implements CanActivate {

  constructor(private http: HttpClient,
              private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    
    console.log('Cargando guardián de rutas de asistente')
    
    return new Promise((resolve) => {
      this.http.get('/server/initialized', { responseType: 'text' })
      .subscribe({
        next: () => {
          resolve(false)
          this.router.navigate(['/login'])
        },
        error: () => {
          resolve(true);
        }
      })
    })
  }
}
