import { Injectable } from '@angular/core';
import { clipboard } from '../helpers/clipboard.helper';

@Injectable({ providedIn: 'root' })
export class PlatformService {

  public clipboard = clipboard;
  
  constructor() { }
}
