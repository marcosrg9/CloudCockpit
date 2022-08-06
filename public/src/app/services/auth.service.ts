import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user = { name: 'Marcos' }

  constructor(private router: Router) { }

  public logout() {
    this.router.navigate(['/login'])
  }
}
