import { Injectable, isDevMode } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { Subject } from 'rxjs';
import { ServersService } from './servers.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  public socket: Socket = new Socket({ url: location.host, options: { autoConnect: false } });

  private pending: { event: string, args: any }[] = [];

  private connecting = false;

  public readonly connected = '';

  constructor() {

    this.connected = this.socket.ioSocket.connected;

    this.socket.on('connect', this.onConnect.bind(this));

    this.socket.on('disconnect', this.onDisconnect.bind(this));
    
    this.socket.once('readyToListen', this.onReadyToListen.bind(this));

  }

  public emit(event: string, ...args: any[] ) {
    this.socket.emit(event, ...args);
  }

  /**
   * Emite únicamente cuando el servidor indique que ha cargado los eventos.
   */
  public emitWhenReady(event: string, ...args: any[]) {

    this.pending.push({ event, args });

  }

  public on(event: string, callback: Function ) {
    this.socket.on(event, callback);
  }

  public once(event: string, callback: Function ) {
    this.socket.once(event, callback);
  }

  public removeAllListeners(event: string | undefined) {
    return this.socket.removeAllListeners(event);
  }

  public removeListener(event: string, callback?: Function | undefined) {
    return this.socket.removeListener(event, callback);
  }

  /** Conecta con el servidor. */
  public connect() {

    // No hay forma de saber si un socket está en proceso de conexión.
    // this.connecting establece una bandera, si es verdadera, se detiene la ejecución.
    // La estructura de la plataforma obliga a solicitar varias veces la conexión.

    if (this.connecting) return;
    if (!this.connected) {
      this.connecting = true;
      this.socket.connect();
    }
  }

  public disconnect() {
    this.socket.disconnect();
  }

  private onConnect() {
    this.connecting = false;
    if (isDevMode()) console.log(`%c✅ Conectado al servidor WebSockets (${this.socket.ioSocket.id})`, 'background: green; color: white; padding: 2px');
  }

  private onDisconnect(reason: string) {
    this.connecting = false;
    if (isDevMode()) console.log(`%c⛔️ Conexión WebSockets cerrada (${reason})`, 'background: darkred; color: white; padding: 2px')
  }
  
  private onReadyToListen() {

    this.pending.forEach(event => this.emit(event.event, ...event.args) )

  }

}
