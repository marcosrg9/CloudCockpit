import { Pipe, PipeTransform } from '@angular/core';
import { WebTerminal } from '../../interfaces/pty.interface';

@Pipe({
  name: 'filterPtys',
  pure: false
})
export class FilterPtysPipe implements PipeTransform {

  constructor() { }

  withPids(value: WebTerminal[]): WebTerminal[] {

    return value.filter(v => v.connection.pid);
    
  }
  
  withoutPids(value: WebTerminal[]): WebTerminal[] {
    
    return value.filter(t => !t.connection.pid);
    
  }
  
  /**
   * Filtra las terminales según tengan pid o no.
   * @param value Array de terminales.
   * @param havePid True - Las terminales devueltas tienen pid.
   */

  /**
   * Filtra las terminales que no tengan pids.
   * @param value Array de terminales.
   * @param havePid False - Las terminales devueltas no tienen pid.
   */
  //transform(value: ttyStore, havePid: false): terminalType[];
  transform(value: WebTerminal[], havePid: boolean = true): WebTerminal[]  {

    if (havePid) return this.withPids(value)
    else return this.withPids(value)
    
    
  }

}
