import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  private socket: Socket = new Socket({ url: '192.168.1.3:3000' })
  public $stream: Subject<string> = new Subject();

  constructor() {

    this.socket.on('connect', () => {
      console.log('Conectado al terminal remoto');
    })

    this.socket.on('data', (data: string) => {
      this.$stream.next(data);
    })

    this.socket.on('kill', (data: any) => {
      console.log(data)
    })

    this.socket.connect()

  }

  public write(data: string) {
    this.socket.emit('write', data);
  }

  public resize(data: {cols: number, rows: number}) {
    this.socket.emit('resize', data);
  }

  public kill() {
    console.log('Matando proceso');
    this.socket.emit('kill')
  }
}
