import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TermsComponent } from './terms.component';
import { NgTerminalModule } from 'ng-terminal';
import { OnloadTermDirective } from 'src/app/directives/onload-term.directive';
import { FilterWithNoPidsPipe } from 'src/app/pipes/filter-with-no-pids.pipe';

@NgModule({
  declarations: [
    TermsComponent,
    OnloadTermDirective,
    FilterWithNoPidsPipe
  ],
  imports: [
    NgTerminalModule,
    CommonModule
  ],
  exports: [ TermsComponent ]
})
export class TermsModule { }
