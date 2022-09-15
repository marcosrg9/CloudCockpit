import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { EncryptionComponent } from './encryption/encryption.component';
import { setupWizardComponent } from './setupWizard.component';

const router: Routes = [
	{ path: '', component: setupWizardComponent, children: [
		{ path: 'encrypt', component: EncryptionComponent },
		{ path: 'admin', component: AdminComponent }
	]},
]
@NgModule({
	imports: [ RouterModule.forChild(router) ],
	exports: [ RouterModule ]
})
export class setupWizardRouterModule { }