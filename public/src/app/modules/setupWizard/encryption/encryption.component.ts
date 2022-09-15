import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-encryption',
  templateUrl: './encryption.component.html',
  styleUrls: ['./encryption.component.css']
})
export class EncryptionComponent implements OnInit {

  public omitMessage = false;

  constructor(private http: HttpClient,
              private router: Router,
              private route: ActivatedRoute) {

    // Comprueba si existe una clave de cifrado válida antes de preguntar.
    this.check();
  }

  check() {
    this.http.get('/server/existsCypher', { responseType: 'text' })
    .subscribe({
      next: () => {
        this.router.navigate(['../admin'], { relativeTo: this.route })
      },
      error: (err) => {
        console.log('No existe una clave de cifrado válida...')
        console.log(err)
      }
    })
  }

  ngOnInit(): void {
  }

}
