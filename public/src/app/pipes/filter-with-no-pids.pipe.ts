import { Pipe, PipeTransform } from '@angular/core';
import { completePty, pty } from '../services/ptys.service';

@Pipe({
  name: 'filterWithNoPids',
  pure: false
})
export class FilterWithNoPidsPipe implements PipeTransform {

  transform(value: pty[]): completePty[]  {
    
    return value.filter(pty => pty.pid) as completePty[];
    
  }

}
