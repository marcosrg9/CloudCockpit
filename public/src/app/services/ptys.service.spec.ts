import { TestBed } from '@angular/core/testing';

import { PtysService } from './ptys.service';

describe('PtysService', () => {
  let service: PtysService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PtysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
