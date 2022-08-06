import { Injectable } from '@angular/core';
import { WebsocketsService } from './websockets.service';

export interface server {
	id: 		number,
	name: 		string,
	MAC?: 		string,
	wolPort?: number,
  allowWol?:boolean, 
	icon?: 		string,
	metal?:		boolean,
	snippets?: { name: string, command: string }[],
	webApps?: { name: string, url: string }[]
}

@Injectable({
  providedIn: 'root'
})
export class ServersService {

  public servers: server[] = []

  constructor(private socket: WebsocketsService) {
    this.socket.once('serversData', (data: server[]) => {
      this.servers = data;
      console.log(data);
      
    })

    socket.emit('getServers');
  }

  public getServerName(id: number): string | undefined {
    return this.getServer(id)?.name;
  }

  /**
   * Obtiene un servidor por su identificador.
   * @param id Identificador del servidor.
   */
  public getServer(id: number): server | undefined {
    return this.servers.find(server => id === server.id);
  }

  /**
   * Envía una señal de emisión de paquete mágico para encender un servidor.
   * @param id Identificador del servidor.
   */
  public sendMagicPkg(id: number): void {

    const server = this.getServer(id)

    if (server && server.allowWol) this.socket.emit('WOL', id);

  }
}
