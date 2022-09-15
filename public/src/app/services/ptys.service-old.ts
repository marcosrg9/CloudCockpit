import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { Terminal } from '../models/terminal.model';
import { WebsocketsService } from './websockets.service';

// TODO: Eliminar este archivo, script programado en sucio.

export interface pty {
  server: number;
  pid: number;
  destroyed?: boolean;
  observable: BehaviorSubject<string>;
  terminal: Terminal;
  focus: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TerminalService {

  public ptys: pty[] = [];

  public lastWithFocus: pty;
  // Almacena la terminal en un servicio para que no se pierda al cambiar de componente.
  public terminal: Terminal = new Terminal();
  public focusTerminal: pty | undefined;

  public waitForCreate: number | null;

  constructor(private socket: WebsocketsService,
              private router: Router) {

    this.socket.on('data', (data: { server: number, pid: number, data: string }) => {

      // Busca la instancia de la terminal.
      const pty = this.terms.find(pty => pty.server === data.server && pty.pid === data.pid);

      // Envía los datos de la terminal del servidor al observable.
      if (pty) {

        if (data.data.includes('[A$<2>')) data.data = data.data.replace('[A$<2>', '');

        pty.observable.next(data.data);
        pty.terminal.write(data.data)

        /* if (this.focusTerminal && this.focusTerminal.pid === data.pid && this.focusTerminal.server === data.server) {
          this.terminal.write(data.data);
        } */
      };

    })
    

  }

  /* // Eventos desde el cliente
  [
    'openTerminal',
    'killTerminal',
    'write',
    'resize',
    'getPtys',
    'disconnect'
  ];

  // Eventos desde la terminal (servidor)
  [
    'data',
    'exit'
  ] */

  /**
   * Abre una sesión SSH en el servidor especificado.
   * @param server Identificador del servidor.
   */
  public createTerminal(server: number) {

    this.blurAll();
    
    this.socket.once('openTerminal', (pid: number) => {
      this.socket.removeAllListeners('connectionError')

      const pty: pty = {
        server: server,
        pid: pid,
        observable: new BehaviorSubject(''),
        terminal: new Terminal(),
        focus: true
      }
      
      //this.focus(server, pty.pid);
      //this.focusTerminal = pty;

      this.terms.push(pty);


    })

    this.socket.once('connectionError', (err: any) => {
      this.socket.removeAllListeners('openTerminal')
      alert('Error de conexión');
      console.error(err)
    })

    
    // Espera un poco para que la terminal se instancie y obtenga las dimensiones adecuadas del padre.
    setTimeout(() => {

      const { cols, rows, element } = this.terminal;
      
      if (element) {
        this.socket.emit('openTerminal', server, { cols, rows, width: element.clientWidth, height: element.clientHeight });
      } else {
        this.socket.emit('openTerminal', server, { cols, rows });
      }
      
    }, 500)
  }

  public write(data: string) {
    this.socket.emit('write', { data, pid: this.focusTerminal?.pid, server: this.focusTerminal?.server})
  }

  /**
   * Emite evento y parámetros de dimensiones al servidor.
   * @param data Parámetros de dimensiones.
   */
  public resizeHandler(terminal: HTMLDivElement) {

    this.terminal.fitAddon.fit();

    setTimeout(() => {

      const { cols, rows } = this.terminal;
      const { clientWidth: width, clientHeight: height } = terminal;

      this.socket.emit('resize', { cols, rows, width, height });
      
    }, 100)

  }

  /**
   * Destruye una terminal activa.
   * @param server Identificador del servidor.
   * @param pid Identificador del proceso.
   */
  public destroy(server: number, pid: number) {
   
    for( let i = 0; i < this.terms.length; i++) {

      const pty = this.terms[i];

      if (pty.server === server && pty.pid === pid) {

        this.terms.splice(i, 1);
        
        if (this.terms.length > 0) this.focusTerminal = this.terms[0];
        else this.router.navigate(['/main']);

        break;
      }
    }
    
  }

  /**
   * Filtra una terminal.
   * @param server Identificador del servidor.
   * @param pid Identificador de proceso.
   */
  public filterPty(server: number, pid: number) {
    return this.terms.find(pty => pty.server === server && pty.pid);
  }

  /**
   * Obtiene todas las terminales abiertas en un servidor.
   * @param server Identificador del servidor.
   */
  public filterPtysByServer(server: number) {
    return this.terms.filter(pty => pty.server === server);
  }

  /**
   * Desenfoca todas las terminales.
   */
  public blurAll() {
    this.terms.forEach(pty => pty.focus = false)
    this.focusTerminal = undefined;
  }

  /**
   * Enfoca una terminal concreta por el identificador de servidor y de proceso.
   * @param server Identificador del servidor.
   * @param pid Identificador de proceso.
   */
  public focus(server: number, pid: number) {

    for(let i = 0; i < this.terms.length; i++) {
      
      const pty = this.terms[i];
      
      if (pty.pid === pid && pty.server === server) {
        /* this.terms[i].focus = true; */
        this.blurAll();
        pty.focus = true;
        this.focusTerminal = pty;

        this.terminal.write('\r\n')
        this.terminal.reset()
        console.log('Reset');
        
        this.terminal.clear();

        this.socket.once('buffer', (data: string | null) => {
          if (!data) {
            pty.observable.subscribe(data => {
              console.log(data);
            }).unsubscribe();
          } else this.terminal.write(data);
        })

        this.socket.emit('readBuffer', pty.pid, pty.server);
        break;
      }


    }
    
    return this.focusTerminal
    /* const ptys = this.filterPtysByServer(server);
    const pty = ptys.find(pty => pty.pid === pid);

    if (pty) {

      this.focusTerminal = pty;

      this.blurAll();

      pty.focus = true;

      this.terminal.clear();

      pty.observable.subscribe(data => {
        this.terminal.write(data);
      }).unsubscribe();

      return pty;

    } else return null; */

  }

  public getFocusedTerminal() {
    return /* this.terms.find(pty => pty.focus === true) || this.terms[0]; */ this.focusTerminal;
  }

  /**
   * Inserta la terminal en un elemento HTML.
   * @param terminal Elemento HTML donde enlazar la terminal
   */
  public bindTerminal(terminal: HTMLDivElement, pid: number, server: number) {

    

    // Abre la terminal.
    this.terminal.open(terminal);
    
    setTimeout(() => {
      
      if (this.focusTerminal) {
        this.focusTerminal.observable.subscribe((data) => this.terminal.write(data)).unsubscribe();
      }

      this.resizeHandler(terminal);
      
      this.terminal.onResize((size) => {
        this.terminal.fitAddon.fit();
        setTimeout(() => {
          this.resizeHandler(terminal);
        }, 200)
        
      })
    }, 100)
  }

  public unbound() {
    //this.terminal.dispose();
  }

  /* public clear(pid: number = this.focus) {

    if (!pid || typeof pid !== 'number') return;

    const pty = this.terms.get(pid);

    if (pty) {
      pty.term.write('\r\n')
      pty.term.clear();
    }

  } */
}
