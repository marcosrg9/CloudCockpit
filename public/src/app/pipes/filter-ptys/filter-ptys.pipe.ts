import { Pipe, PipeTransform } from '@angular/core';
import { completePty, pty, successfulConnection, terminalType } from '../../interfaces/pty.interface';

@Pipe({
  name: 'filterPtys',
  pure: false
})
export class FilterPtysPipe implements PipeTransform {

  constructor() { }

  withPids(value: successfulConnection[]): successfulConnection[] {

    return value.filter(t => t.pid);
    
  }
  
  withoutPids(value: terminalType[]): any[] {
    
    return value.filter(pty => 'pid' !in pty);
    
  }
  
  /**
   * Filtra las terminales según tengan pid o no.
   * @param value Array de terminales.
   * @param havePid True - Las terminales devueltas tienen pid.
   */
  transform(value: terminalType[], havePid?: true): successfulConnection[];

  /**
   * Filtra las terminales que no tengan pids.
   * @param value Array de terminales.
   * @param havePid False - Las terminales devueltas no tienen pid.
   */
  transform(value: terminalType[], havePid: false): terminalType[];
  transform(value: successfulConnection[], havePid: boolean = true): successfulConnection[]  {
    
    if (havePid) return this.withPids(value)
    else return this.withoutPids(value);
    
  }

}
