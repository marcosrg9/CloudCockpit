import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService extends Socket {

  public $stream: Subject<string> = new Subject();

  constructor() {

    super({ url: '192.168.1.3:3000' })

    this.on('connect', () => {
      console.log('Conectado al terminal remoto');

      /* setTimeout(() => {
        this.socket.emit('openTerminal', (data: any) => {
          console.log(data);
        });
      }, 1000) */
    })

    /* this.socket.on('data', (data: string) => {
      this.$stream.next(data);
    })

    this.socket.on('kill', (data: any) => {
      console.log(data)
    })

    this.socket.connect() */

  }

  /* public resize(data: {cols: number, rows: number}) {
    this.socket.emit('resize', data);
  }

  public kill() {
    console.log('Matando proceso');
    this.socket.emit('kill')
  } */
}
