import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ServersService } from './servers.service';
import { TerminalService } from './terminal.service';
import { WebsocketsService } from './websockets.service';

export interface user {
	_id?: 			string,
	username: 	string,
	password: 	string,
	role: 			'admin' | 'standard'
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public user: user | undefined;

  constructor(private router: Router,
              private http: HttpClient,
              private socket: WebsocketsService,
              private servers: ServersService,
              private terms: TerminalService) {

    this.socket.on('authError', () => {
      this.logout();
    })

  }

  /** Inicia sesión en el servidor con los parámetros dados. */
  public login(user: string, password: string) {

    return new Promise<user>((resolve, reject) => {
      
      this.http.post<user>('/auth/login', { user, password })
      .subscribe({
        next: (user) => {
          this.user = user;
          this.socket.connect();
          resolve(user);
        },
        error: (err) => {
          reject(err);
        }
      })

    })

  }

  public recoverSessionData() {

    return new Promise((resolve, reject) => {

      this.http.get<user>('/auth/recoverSession')
      .subscribe({
        next: (data) => {
          this.user = data;
          this.socket.connect()
          resolve(data);
        },
        error: (err) => {
          reject(err);
        }
      })

    })

  }

  public logout() {
    this.http.get('/auth/logout').subscribe({
      next: () => {
        this.user = undefined;
        this.servers.cleanUp();
        this.terms.cleanUp();
        this.router.navigate(['/login'])
      },
      error: () => {
        this.user = undefined;
        this.servers.cleanUp();
        this.terms.cleanUp();
        this.router.navigate(['/login'])
      }
    });
    
  }
}
