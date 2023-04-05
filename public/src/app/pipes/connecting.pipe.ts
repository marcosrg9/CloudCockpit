import { Pipe, PipeTransform } from '@angular/core';
import { WebTerminal } from '../interfaces/pty.interface';

@Pipe({
  name: 'connecting',
  pure: false
})
export class ConnectingPipe implements PipeTransform {

  transform(value: WebTerminal[], ...args: unknown[]): WebTerminal[] {

    return value.filter(v => {
      if (v.connection.status === 'connecting') return v
      if (!v.connection.status) return v
    })
    
  }

}
