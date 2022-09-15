import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'
import { setupWizardComponent } from './setupWizard.component';
import { setupWizardRouterModule } from './setupWizard.routes';
import { AdminComponent } from './admin/admin.component';
import { EncryptionComponent } from './encryption/encryption.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    setupWizardComponent,
    AdminComponent,
    EncryptionComponent
  ],
  imports: [
    CommonModule,
    setupWizardRouterModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ]
})
export class InitializeModule { }
