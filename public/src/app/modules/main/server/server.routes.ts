import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewComponent } from './new/new.component';
import { ServerComponent } from './server.component';

const router: Routes = [
	{ path: '', children: [
		{ path: '', component: ServerComponent },
		{ path: 'new', component: NewComponent },
		{ path: ':server', children: [
			{ path: '', component: ServerComponent },
			{ path: 'settings', loadChildren: () => import('./settings/settings.module').then(m => m.SettingsModule) },
		] },
	]}
];

@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class ServerRouterModule { }