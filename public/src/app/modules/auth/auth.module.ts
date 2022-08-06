import { NgModule } from '@angular/core';
import { AuthRoutingModule } from './auth.routes';
import { AuthComponent } from './auth.component';

@NgModule({
  declarations: [ AuthComponent ],
  imports: [ AuthRoutingModule ]
})
export class AuthModule { }
