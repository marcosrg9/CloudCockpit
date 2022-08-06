import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MainComponent } from './main.component';
import { ServerComponent } from './server/server.component';
import { TermsComponent } from './terms/terms.component';

const router: Routes = [
	{ path: 'main', component: MainComponent, children: [
		{ path: '', component: DashboardComponent },
		{ path: 'terms', component: TermsComponent },
		{ path: 'server/:server', component: ServerComponent },
	] },
	{ path: '**', redirectTo: 'main', pathMatch: 'full' },
];

@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class MainRouterModule { }