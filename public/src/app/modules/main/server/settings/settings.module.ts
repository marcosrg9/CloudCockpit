import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralComponent } from './general/general.component';
import { AccountsComponent } from './accounts/accounts.component';
import { SnippetsComponent } from './snippets/snippets.component';
import { LinksComponent } from './links/links.component';
import { ServerRouterModule } from '../server.routes';
import { RouterModule } from '@angular/router';
import { SettingsRouterModule } from './settings.routes';
import { SettingsComponent } from './settings.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    SettingsComponent,
    GeneralComponent,
    AccountsComponent,
    SnippetsComponent,
    LinksComponent
  ],
  imports: [
    SettingsRouterModule,
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SettingsModule { }
