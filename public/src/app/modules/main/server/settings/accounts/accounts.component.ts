import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterService } from 'src/app/services/router.service';
import { ServersService } from 'src/app/services/servers.service';
import { authForClient } from '../../../../../../../../src/interfaces/auth.interface';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {


  /** Almacenamiento del formulario. */
  public authForm = new FormGroup({
    username: new FormControl('', [Validators.required]),
    password: new FormControl(''),
    description: new FormControl('')
  })

  /** Identificador de servidor. */
  serverId: string;

  /** Referencia de la credencial enfocada. */
  public focusedAuth: authForClient & { new?: boolean } | undefined;

  /** Credenciales filtradas bajo un criterio de búsqueda. */
  public filteredAccounts: authForClient[] | undefined = undefined;

  /** Credenciales. */
  public accounts: authForClient[] | undefined = undefined;

  public deleteMessage = false;

  constructor(public server: ServersService,
              public route: ActivatedRoute,
              public router: Router,
              public routerService: RouterService) { }

  /**
   * Establece el valor de la propiedad de credencial enfocada a un placeholder de valores
   * vacíos y reestablece el formulario.
   */
  addNewAuth() {
    this.deleteMessage = false;
    this.focusedAuth = { new: true, _id: '', description: '', username: '' }
    this.authForm.controls.password.addValidators(Validators.required);
    this.authForm.markAsUntouched();
    this.authForm.reset();
  }

  /**
   * Guarda los datos de la credencial almacenada en la propiedad focusedAuth.
   */
  saveAuth() {
    if (!this.authForm.valid) return;
    const newData = {
      _id: this.focusedAuth?._id || '',
      new: this.focusedAuth?.new,
      username: this.authForm.value?.username || '',
      password: this.authForm.value?.password || '',
      description: this.authForm.value?.description || '',
      server: this.serverId
    }
    this.server.authStore.set(newData)
    .then(a => {
      this.resolveAuths();
      this.quitFocus();
    })
  }

  /**
   * Enfoca una credencial para mostrar los inputs.
   * @param id Identificador de la credencial.
   */
  focusAuth(id: string | undefined) {
    this.deleteMessage = false;
    if (this.focusedAuth?._id === id) return this.quitFocus();
    if (!this.accounts || this.accounts.length < 1 ) return;
    this.focusedAuth = this.accounts.find(a => a._id === id);
    if (!this.focusedAuth) return;
    this.authForm.get('username')?.setValue(this.focusedAuth.username);
    this.authForm.get('description')?.setValue(this.focusedAuth.description);
    this.authForm.controls.password.removeValidators(Validators.required);
    this.authForm.markAsUntouched();
  }

  /**
   * Restablece los valores del formulario y elimina el valor de la propiedad de credencial enfocada.
   */
  quitFocus() {
    this.authForm.reset();
    this.deleteMessage = false;
    this.focusedAuth = undefined;
    this.authForm.controls.password.removeValidators(Validators.required);
  }

  /**
   * Filtra las credenciales que cumplan con el criterio de búsqueda.
   * @param value Criterio de búsqueda.
   */
  filter(value: string) {
    if (value === '') return this.filteredAccounts = this.accounts
    if (!this.accounts) return;
    this.filteredAccounts = this.accounts.filter(a => a.username.includes(value) || a.description.includes(value));
    
  }

  confirmDeletion() {
    if (!this.focusedAuth) return;
    this.server.authStore.delete(this.focusedAuth?._id)
    .then(() => {
      this.resolveAuths();
    })
    .catch(() => {
    })
    .finally(() => {
      this.quitFocus();
    })
  }

  private resolveAuths() {
    this.server.authStore.resolveAuthsOfServer(this.serverId)
    .then(a => {
      this.accounts = a;
      this.filteredAccounts = this.accounts;
    })
  }

  ngOnInit() {
    const { server } = this.routerService.getAllRouteParams(this.route);

    if (!server) return this.router.navigate(['main']);

    this.serverId = server;
    this.resolveAuths();
  }

}
