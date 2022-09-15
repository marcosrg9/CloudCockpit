import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from 'src/app/guards/authGuard.service';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainComponent } from './main.component';
import { TermsComponent } from './terms/terms.component';

const router: Routes = [
	{ path: 'main', canActivate: [AuthGuardService] , component: MainComponent, children: [
		{ path: '', component: DashboardComponent },
		{ path: 'terms', component: TermsComponent },
		{ path: 'server', loadChildren: () => import('./server/server.module').then(m => m.ServerModule) },
	] },
	{ path: '**', redirectTo: 'main', pathMatch: 'full' },
];

@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class MainRouterModule { }