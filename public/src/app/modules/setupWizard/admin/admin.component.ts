import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomValidators } from './password.validator';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  public userForm: FormGroup = new FormGroup({
    user: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    repeatPassword: new FormControl('', [Validators.required, Validators.minLength(6) ])
  }, [CustomValidators.MatchValidator('password', 'repeatPassword')])

  public passwordMismatch = false;

  constructor(private http: HttpClient,
              private router: Router) { }

  public submit() {
    
    const { status, value } = this.userForm;
    const { user, password, repeatPassword } = value;
    
    if (status !== 'VALID') return;

    if (password !== repeatPassword) return this.passwordMismatch = true;

    this.http.post('/auth/firstSignUp', { user, password }, { responseType: 'text' })
    .subscribe({
      next: () => {
        this.router.navigate(['/login'])
      },
      error: (err) => {
        console.error(err)
      } 
    })

  }

  ngOnInit(): void { }

  get passwordMatchError() {
    return (
      this.userForm.getError('mismatch') &&
      this.userForm.get('repeatPassword')?.touched
    );
  }

}
