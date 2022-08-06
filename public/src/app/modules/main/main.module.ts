import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRouterModule } from './main.routes';

import { MainComponent } from './main.component';
import { TermsModule } from './terms/terms.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServerModule } from './server/server.module';

@NgModule({
  declarations: [
    MainComponent,
    DashboardComponent,
  ],
  imports: [
    CommonModule,
    MainRouterModule,
    TermsModule,
    ServerModule
  ]
})
export class MainModule { }
