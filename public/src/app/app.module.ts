import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NgTerminalModule } from 'ng-terminal';
import { SocketIoModule } from 'ngx-socket-io'

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgTerminalModule,
    SocketIoModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
