import { TestBed } from '@angular/core/testing';

import { CanLoadSetupWizardService } from './can-load-setup-wizard.service';

describe('CanLoadSetupWizardService', () => {
  let service: CanLoadSetupWizardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanLoadSetupWizardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
