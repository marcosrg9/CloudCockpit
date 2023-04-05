import { AfterContentChecked, AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnInit, Output, ViewChild, ViewChildren } from '@angular/core';
import { filteredActions } from 'src/app/interfaces/filter.interface';
import { ActionsFilter } from './commands/filters/actions.filter';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.css']
})
export class PaletteComponent implements AfterViewInit {

  public criteria = '';

  public filteredData: filteredActions | undefined;

  @ViewChild('paletteCont') parent: ElementRef<HTMLInputElement>
  @ViewChild('input') inp: ElementRef<HTMLInputElement>
  @Output() close: EventEmitter<void> = new EventEmitter();
  @Output() clickInside: EventEmitter<void> = new EventEmitter();

  constructor() {
    this.search()
  }

  @HostListener('document:click')``
  onClick() { this.closeCommandPalette() }

  @HostListener('click', ['$event'])
  click(event: MouseEvent) {
    event.stopPropagation();
    //this.clickInside.emit()
  }
  
  public onEscape() {
    this.closeCommandPalette(true)
  }

  ngAfterViewInit(): void {
    this.inp.nativeElement.focus();
  }

  public search() {

    this.filteredData = ActionsFilter.filter(this.criteria);
    
  }

  private closeCommandPalette(byEscKey = false) {
    
    if (byEscKey && this.criteria.length > 0) {
      this.filteredData = undefined;
      return this.criteria = '';
    }
    this.close.emit()
  }

  public arrowDown() {
    console.log('ArrowDown');
    
  }

}
