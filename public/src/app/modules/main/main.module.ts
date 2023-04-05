import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRouterModule } from './main.routes';

import { MainComponent } from './main.component';
import { TermsModule } from './terms/terms.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ServerModule } from './server/server.module';
import { ErrorMsgPipe } from 'src/app/pipes/error-msg.pipe';
import { FilterPtysModule } from 'src/app/pipes/filter-ptys/filter-ptys.module';
import { ConnectingPipe } from 'src/app/pipes/connecting.pipe';
import { PaletteModule } from './palette/palette.module';

@NgModule({
  declarations: [
    MainComponent,
    DashboardComponent,
    ErrorMsgPipe,
    ConnectingPipe
  ],
  imports: [
    MainRouterModule,
    ServerModule,
    CommonModule,
    TermsModule,
    FilterPtysModule,
    PaletteModule
  ]
})
export class MainModule { }
