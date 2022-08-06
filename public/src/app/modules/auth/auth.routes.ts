import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { AuthComponent } from './auth.component';

const router: Routes = [
	{ path: 'login', component: AuthComponent },
	{ path: '', pathMatch: 'full', redirectTo: '/login' }
];

@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class AuthRoutingModule { }