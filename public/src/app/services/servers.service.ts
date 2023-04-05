import { Injectable } from '@angular/core';
import { serverStore } from '../data/servers.data';
import { server } from '../interfaces/server.interface';
import { WebsocketsService } from './websockets.service';


@Injectable({
  providedIn: 'root'
})
export class ServersService {

  public store = serverStore;
  private _fetchedServers = false;

  //public servers: server[] | null;

  constructor(private socket: WebsocketsService) {

    this.listenGlobalEvents();
    this.fetchAllServers()

  }

  public listenGlobalEvents() {

    this.socket.on('serverData', (data: server[]) => {
      this.store.servers = data;
      if (!this.fetchedServers) this._fetchedServers = true;
    })
    this.socket.on('newServer', () => { this.fetchAllServers() })

  }

  public fetchAllServers() {
    this.socket.emit('getServers')
  }

  public getServerName(id: string): string | undefined {
    return this.getServer(id)?.name;
  }

  /**
   * Obtiene un servidor por su identificador.
   * @param id Identificador del servidor.
   */
  public getServer(id: string): server | undefined {
    if (this.servers) return this.servers.find(server => id === server._id)
    else return undefined;
  }

  /**
   * Envía una señal de emisión de paquete mágico para encender un servidor.
   * @param id Identificador del servidor.
   */
  public wakeUp(id: string): void {

    const server = this.getServer(id)

    if (server && server.MAC) this.socket.emit('wakeUp', id);

  }

  /**
   * Limpia la lista de servidores.
   */
  public cleanUp() {
    this.store.servers = [];
    this._fetchedServers = false;

    this.socket.removeAllListeners('serverData');
    this.socket.removeAllListeners('newServer');
  }

  // Getter y setter que enlazan con el almacén.
  get servers() { return this.store.servers }
  set servers(servers: server[]) { this.store.servers = servers }

  get fetchedServers() { return this._fetchedServers };

}
