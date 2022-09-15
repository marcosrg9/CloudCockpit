import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsComponent } from './terms.component';
/* import { NgTerminalModule } from 'ng-terminal'; */
import { OnloadTermDirective } from 'src/app/directives/onload-term.directive';
import { FilterPtysModule } from 'src/app/pipes/filter-ptys/filter-ptys.module';

@NgModule({
  declarations: [
    TermsComponent,
    OnloadTermDirective,
  ],
  imports: [
    /* NgTerminalModule, */
    CommonModule,
    FilterPtysModule
  ],
  exports: [ TermsComponent ]
})
export class TermsModule { }
