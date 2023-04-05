import { Pipe, PipeTransform } from '@angular/core';
import { connectionError } from '../../../../src/interfaces/unifiedStructure.interface';
import { ServersService } from '../services/servers.service';

@Pipe({
  name: 'errorMsg'
})
export class ErrorMsgPipe implements PipeTransform {

  constructor(private server: ServersService) { }

  title(error: connectionError): string {

    if (!error.error.code && error.error.level) return 'Timeout';
    
    switch(error.error.code) {
      case 'ENETUNREACH': return 'Destino inalcanzable'
      case 'EHOSTDOWN': return 'Dispositivo desconectado'
      default: return 'Desconocido'
    }
  }

  message(error: connectionError): string {

    const serverName = this.server.getServerName(error.host);

    if (!error.error.code && error.error.level) {

      return `La conexión al servidor ${ serverName } ha tomado demasiado tiempo.`

    }

    switch(error.error.code) {
      case 'ENETUNREACH':
        return `No se ha podido conectar con ${ serverName } porque no es accesible.`;
      case 'EHOSTDOWN':
        return `El servidor ${ serverName } no se encuentra disponible.`
      default:
        return 'Error de conexión desconocido'
    }
  }

  transform(error: connectionError, type: 'errorMessage' | 'errorTitle'): string {

    if (type === 'errorMessage') return this.message(error)
    else if (type === 'errorTitle') return this.title(error)
    else return ''
    
  }

}
