import { Pipe, PipeTransform } from '@angular/core';
import { incommingConnection, processingConnection } from '../interfaces/pty.interface';

@Pipe({
  name: 'connecting'
})
export class ConnectingPipe implements PipeTransform {

  transform(value: processingConnection[], ...args: unknown[]): processingConnection[] {

    return value.filter(v => {
      if (v.status === 'connecting') return v
      if (!v.status) return v
    })
    
  }

}
