import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {

  public logInErr = false;

  constructor(private http: HttpClient,
              private router: Router,
              private auth: AuthService) {
    
    // Comprueba si hay una sesión iniciada.
    auth.recoverSessionData()
    .then((a) => {
      this.router.navigate(['/main']);
    })
    .catch(() => {

      this.http.get('/server/initialized', { responseType: 'text' })
      .subscribe({
        error: () => {
          this.router.navigate(['/setupWizard'])
        }
      })

    })
  }

  public login(user: string, password: string) {
    //this.router.navigate(['/main']);

    this.auth.login(user, password)
    .then((user) => {
      this.router.navigate(['/main'])
    })
    .catch((err: HttpErrorResponse) => {
      
      if (err.error === 'User or password wrong...') {
        this.logInErr = true;
        setTimeout(() => {
          this.logInErr = false;
        }, 5000)
      } else console.error(err)
    })

  }

  ngOnInit(): void { }
  
}
