import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { addressesValidator } from './server.validator';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css']
})
export class NewComponent implements OnInit {

  public serverForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    host: new FormControl('', [Validators.required, addressesValidator.hostValidator]),
    port: new FormControl('', [ addressesValidator.SSHPortValidator ]),
    enableWol: new FormControl(false, [ addressesValidator.checkCleanUp ]),
    macAddress: new FormControl('', [ addressesValidator.MacValidator ]),
    wolPort: new FormControl('', [ addressesValidator.WOLPortValidator ])
  })

  public overrideHostValidations = false;

  public keyPressed = '';

  constructor(public location: Location,
              public http: HttpClient) { }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {

    this.keyPressed = ev.key;

  }

  @HostListener('document:keyup', ['$event'])
  onKeyUp(ev: KeyboardEvent) {

    this.keyPressed = '';

  }

  public submit() {

    if (this.serverForm.valid) {
      
      const { name, host, macAddress, wolPort, port } = this.serverForm.value;

      const data = { name, host, port, MAC: macAddress, wolPort}
      
      this.http.post('/auth/user/servers/new', data).subscribe({
        next: () => {},
        error: (err) => {
          console.log(err)
        }
      })
    }

  }

  public checkNameError() {

    const ctrl = this.serverForm.get('name');

    return ctrl?.touched && ctrl.getError('required');

  }

  public checkHostError() {
    
    const ctrl = this.serverForm.get('host');

    return ctrl?.touched && ctrl.getError('addressError');

  }

  public checkMacError() {

    const ctrl = this.serverForm.get('macAddress');

    return ctrl?.touched && ctrl?.getError('macError');

  }

  public checkPortError(control: string) {

    const ctrl = this.serverForm.get(control);

    return ctrl?.touched && ctrl?.getError('portError')

  }

  ngOnInit(): void {
  }

}
