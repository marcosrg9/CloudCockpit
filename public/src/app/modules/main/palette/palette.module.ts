import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaletteComponent } from './palette.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    PaletteComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    PaletteComponent
  ]
})
export class PaletteModule { }
