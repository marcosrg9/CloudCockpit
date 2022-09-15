import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsComponent } from './accounts/accounts.component';
import { GeneralComponent } from './general/general.component';
import { LinksComponent } from './links/links.component';
import { SettingsComponent } from './settings.component';
import { SnippetsComponent } from './snippets/snippets.component';

const router: Routes = [
	{ path: '', component: SettingsComponent, children: [
		{ path: 'general', component: GeneralComponent },
		{ path: 'accounts', component: AccountsComponent },
		{ path: 'snippets', component: SnippetsComponent },
		{ path: 'links', component: LinksComponent },
		{ path: '**', pathMatch: 'full', redirectTo: 'general' },
	] }
]

@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class SettingsRouterModule { }