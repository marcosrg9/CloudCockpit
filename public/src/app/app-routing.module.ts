import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanLoadSetupWizardService } from './guards/can-load-setup-wizard.service';

const routes: Routes = [
  { path: 'setupWizard', canActivate: [CanLoadSetupWizardService], loadChildren: () => import('./modules/setupWizard/setupWizard.module').then(m => m.InitializeModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
