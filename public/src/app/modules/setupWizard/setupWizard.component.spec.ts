import { ComponentFixture, TestBed } from '@angular/core/testing';

import { setupWizardComponent } from './setupWizard.component';

describe('setupWizardComponent', () => {
  let component: setupWizardComponent;
  let fixture: ComponentFixture<setupWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ setupWizardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(setupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
