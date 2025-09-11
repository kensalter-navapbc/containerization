import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from '../app.component';

describe('AppComponent - Visual Regression Tests', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Layout Consistency', () => {
    it('should render only router-outlet', () => {
      fixture.detectChanges();
      
      const routerOutlet = compiled.querySelector('router-outlet');
      expect(routerOutlet).toBeTruthy();
      
      // Should not have any other content besides router-outlet
      const allChildren = Array.from(compiled.children);
      expect(allChildren.length).toBe(1);
      expect(allChildren[0].tagName.toLowerCase()).toBe('router-outlet');
    });

    it('should maintain minimal DOM structure', () => {
      fixture.detectChanges();
      
      // The component should be very lightweight with minimal DOM
      expect(compiled.children.length).toBeLessThanOrEqual(1);
    });
  });
});