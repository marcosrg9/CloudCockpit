import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth.routes';
import { AuthComponent } from './auth.component';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ AuthComponent ],
  imports: [ AuthRoutingModule, HttpClientModule, CommonModule ],
})
export class AuthModule { }
