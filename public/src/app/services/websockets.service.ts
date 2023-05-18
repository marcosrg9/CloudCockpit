import { Injectable, isDevMode } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { statusAndParams } from '../data/statuses.data';
import { stores } from '../data/store.data';
import { ServersService } from './servers.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketsService {

  private socket: Socket = new Socket({ url: location.host, options: { autoConnect: false }});

  private pendingPool: { event: string, args: any }[] = [];

  private connecting = false;

  public connected = false;

  constructor() {

    this.connected = this.socket.ioSocket.connected;

    stores.socket = this;

    this.socket.on('connect', this.onConnect.bind(this));

    this.socket.on('disconnect', this.onDisconnect.bind(this));
    
    this.socket.once('readyToListen', this.onReadyToListen.bind(this));

    statusAndParams.webSocket = {
      connected: this.connected,
      connecting: this.connecting
    }

  }

  public emit(event: string, ...args: any[] ): void {
    if (!this.connected) return this.emitWhenReady(event, ...args);
    this.socket.emit(event, ...args);
  }

  /**
   * Emite únicamente cuando el servidor indique que ha cargado los eventos.
   */
  public emitWhenReady(event: string, ...args: any[]): void {
    if (this.connected) {
      return this.emit(event, ...args)
    }
    this.pendingPool.push({ event, args });

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
      statusAndParams.webSocket.connecting = true
      this.connecting = true;
      this.socket.connect();

      // Escucha el evento de conexión.
      this.socket.once('connect', () => {
        this.connecting = false;
        this.connected = true;
        statusAndParams.webSocket = {
          connected: this.connected,
          connecting: this.connecting
        }
        this.socket.removeAllListeners('connect_error');
      })
      
      // Escucha el evento de error de conexión
      this.socket.once('connect_error', () => {
        this.connecting = false;
        this.connected = false;
        statusAndParams.webSocket.connecting = this.connecting;
        statusAndParams.webSocket.connected = this.connected;
        
        ['connect', 'disconnect'].forEach((e) => this.socket.removeAllListeners(e));
      })
      
      // Escucha el evento de desconexión.
      this.socket.once('disconnect', (reason: string) => {
        this.connecting = false;
        this.connected = false;
        statusAndParams.webSocket.connecting = this.connecting;
        statusAndParams.webSocket.connected = this.connected;
        ['connect', 'connect_error'].forEach((e) => this.socket.removeAllListeners(e));
      })
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

    this.pendingPool.forEach(event => this.emit(event.event, ...event.args) )

  }

}
