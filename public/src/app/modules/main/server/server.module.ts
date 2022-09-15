import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServerComponent } from './server.component';
import { RouterModule } from '@angular/router';
import { ServerRouterModule } from './server.routes';
import { SettingsModule } from './settings/settings.module';
import { NewComponent } from './new/new.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ServerComponent,
    NewComponent
  ],
  imports: [
    ServerRouterModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsModule,
    RouterModule,
    CommonModule,
  ]
})
export class ServerModule { }
