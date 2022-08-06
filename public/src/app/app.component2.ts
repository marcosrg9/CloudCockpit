import { AfterViewInit, Component, HostListener, ViewChild } from '@angular/core';
import { NgTerminal, FunctionsUsingCSI } from 'ng-terminal';
import { WebsocketsService } from './services/websockets.service';
import { SearchAddon } from 'xterm-addon-search'
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {

  @HostListener('document:keydown', ['$event'])
  keydown(e: KeyboardEvent) {

    if ((e.metaKey || e.ctrlKey)) {

      if (e.key.toLowerCase() === 'v') this.paste();
    }
  }

  @HostListener('document:keyup', ['$event'])
  keyup(e: KeyboardEvent) {
    if (e.altKey) {
      if (e.key.toLowerCase() === 'arrowleft') this.insertSequence('\x1b[1;6C', false)
      if (e.key.toLowerCase() === 'arrowright') this.insertSequence('\x1b[f', false)
    }
    if (e.ctrlKey) {
      console.log(e);
      
      if (e.key.toLowerCase() === 'c') return this.insertSequence('\x03', true);
    }
  }

  @ViewChild('term', { static: true }) child: NgTerminal;

  /** Cadena de corte del prompt.
   * Indica desde dónde hay que cortar (Ejemplo: $ o #) */
  private lastForCut = '';
  /** Almacena el comando sin la cadena de corte */
  private promptLn = '';

  //Addons
  private search = new SearchAddon();
  private fit = new FitAddon();
  private webLinks = new WebLinksAddon();

  constructor(public sockets: WebsocketsService) {
    this.fit.fit();
  }
  
  ngAfterViewInit(): void {
    return
    this.child.underlying.loadAddon(this.search);
    this.child.underlying.loadAddon(this.fit);
    this.child.underlying.loadAddon(this.webLinks);

    this.child.underlying.options = {
      rendererType: 'dom',
      cursorStyle: 'bar',
      cursorBlink: true,
      fontFamily: 'MesloLGS NF, Monaco, Monospace',
      fontSize: 16,
      theme: {
        black: '#000000',
        red: '#cd3131',
        green: '#05bc79',
        yellow: '#e5e512',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#0fa8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#BE3F39',
        brightGreen: '#05bc79',
        brightYellow: '#e5e512',
        brightBlue: '#2472c8',
        brightMagenta: '#bc3fbc',
        brightCyan: '#0fa8cd',
        brightWhite: '#e5e5e5',
        cursor: '#0080ff',
        cursorAccent: '#00ff00',
        selection: '#5a5c62',
        selectionForeground: '#ece7e7',
        background: '#262a33',
        foreground: '#ffffff',
      }
    }

    this.child.underlying.onResize((data) => {
      this.sockets.resize(data)
    })
    
    this.sockets.$stream.subscribe(data => {
      const { active } = this.child.underlying.buffer;
      this.child.write(data)
      this.promptLn = '';

      // Espera un poco hasta que se haya imprimido la línea en la terminal.
      setTimeout(() => {
        // El recorte de los espacios blancos por defecto del translate da fallos, usar trim nativo.
        this.lastForCut = active.getLine(active.cursorY + active.viewportY)!.translateToString(false).trim();
        this.storeLastLine(this.lastForCut);
      }, 10)


    })

    const { active } = this.child.underlying.buffer;

    this.child.underlying.onWriteParsed(() => {
      this.storeLastLine(active.getLine(active.cursorY + active.viewportY)!.translateToString(false).trim());
    })

    this.child.keyEventInput.subscribe(e => {

      //FIXME: FunctionsUsingCSI puede producir caracteres extraños que la pty no puede interpretar.
      
      if (e.domEvent.code === 'Enter') {
        
        this.child.write('\r')
        this.sockets.write(this.promptLn + '\r')
        
        return;

      } else if (e.domEvent.code === 'Backspace') {

        if (active.cursorX > this.lastForCut.length + 1) {
          this.child.write('\b \b');
          this.child.write(FunctionsUsingCSI.deleteCharacter(1))
        }

      } else if (e.domEvent.code === 'ArrowUp') {
        console.log(FunctionsUsingCSI.cursorDown(1));
        this.sockets.write(FunctionsUsingCSI.cursorUp(1))
        
        
      } else if (e.domEvent.code === 'ArrowDown') {
        this.sockets.write(FunctionsUsingCSI.cursorNextLine(1))

      } else if (e.domEvent.code === 'ArrowLeft') {
        if (active.cursorX > this.lastForCut.length + 1) {
          this.child.write(FunctionsUsingCSI.cursorBackward(1));
        }

      } else if (e.domEvent.code === 'ArrowRight') {
        if (active.cursorX < this.promptLn.length + this.lastForCut.length) {
          this.child.write(FunctionsUsingCSI.cursorForward(1))
        }

      } else if (e.domEvent.code === 'Tab') {
        this.child.write('\t')

      } else if (e.domEvent.code === 'Delete') {
        this.child.write(FunctionsUsingCSI.deleteCharacter(1))

      } else {
        this.child.write(FunctionsUsingCSI.insertBlank(1))
        this.child.write(e.domEvent.key)
        
      }
    })
    
  }

  /**
   * Recorta y almacena la línea en la propiedad del prompt
   * @param data Cadena de la línea
   */
  storeLastLine(data: string) {
    this.promptLn = data.substring(this.lastForCut.trim().length)
    
  }

  print() {
    const { lastForCut, promptLn } = this;
    console.log(`Cadena de corte: ${lastForCut}`);
    console.log(`Prompt: ${promptLn}`);
  }

  paste() {
    navigator.clipboard.readText()
    .then(data => {
      if (this.child.underlying) this.child.underlying.write(data)
    })
  }

  /**
   * Inserta las secuencias de terminal.
   * https://xtermjs.org/docs/api/vtfeatures/ \
   * https://www.windmill.co.uk/ascii-control-codes.html
   */
  private insertSequence(seq: string, toPty: boolean = false) {

    if (toPty) {
      this.sockets.write(seq);
    } else {
      this.child.write(seq)
    }
  }

  magnify() {
    if (this.child.underlying.options.fontSize) this.child.underlying.options.fontSize++;
  }

  minify() {
    if (this.child.underlying.options.fontSize) this.child.underlying.options.fontSize--;
  }
}
