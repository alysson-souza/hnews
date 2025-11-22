import type { MockedObject } from 'vitest';
// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavLinkComponent } from './nav-link.component';
import { ScrollService } from '../../../services/scroll.service';
import { By } from '@angular/platform-browser';

describe('NavLinkComponent', () => {
  let component: NavLinkComponent;
  let fixture: ComponentFixture<NavLinkComponent>;
  let scrollService: MockedObject<ScrollService>;

  beforeEach(async () => {
    const scrollServiceSpy = {
      scrollToTop: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NavLinkComponent],
      providers: [
        provideRouter([]),
        {
          provide: ScrollService,
          useValue: scrollServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavLinkComponent);
    component = fixture.componentInstance;
    scrollService = TestBed.inject(ScrollService) as MockedObject<ScrollService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleClick', () => {
    it('should scroll to top when called', () => {
      // Act
      component.handleClick();

      // Assert
      expect(scrollService.scrollToTop).toHaveBeenCalled();
    });
  });

  describe('getLinkClasses', () => {
    it('should return nav-link-mobile when mobile is true', () => {
      // Arrange
      component.mobile = true;

      // Act
      const result = component.getLinkClasses();

      // Assert
      expect(result).toBe('nav-link-mobile');
    });

    it('should return nav-link when mobile is false', () => {
      // Arrange
      component.mobile = false;

      // Act
      const result = component.getLinkClasses();

      // Assert
      expect(result).toBe('nav-link');
    });
  });

  describe('template rendering', () => {
    it('should render content inside anchor tag', () => {
      // Arrange
      component.route = '/test';
      fixture.detectChanges();

      // Act
      const linkElement = fixture.debugElement.query(By.css('a'));
      const content = fixture.nativeElement.textContent;

      // Assert
      expect(linkElement).toBeTruthy();
      expect(linkElement.nativeElement.getAttribute('href')).toBe('/test');
      expect(content.trim()).toBe('');
    });

    it('should apply correct CSS classes', () => {
      // Arrange
      component.mobile = true;
      fixture.detectChanges();

      // Act
      const linkElement = fixture.debugElement.query(By.css('a'));

      // Assert
      expect(linkElement.classes['nav-link-mobile']).toBe(true);
    });

    it('should set aria-current attribute when active', () => {
      // Arrange
      component.isActive = true;
      fixture.detectChanges();

      // Act
      const linkElement = fixture.debugElement.query(By.css('a'));

      // Assert
      expect(linkElement.attributes['aria-current']).toBe('page');
    });

    it('should not set aria-current attribute when not active', () => {
      // Arrange
      component.isActive = false;
      fixture.detectChanges();

      // Act
      const linkElement = fixture.debugElement.query(By.css('a'));

      // Assert
      expect(linkElement.attributes['aria-current']).toBeUndefined();
    });
  });

  describe('click event binding', () => {
    it('should call handleClick when anchor is clicked', () => {
      // Arrange
      vi.spyOn(component, 'handleClick');
      component.route = '/test';
      fixture.detectChanges();

      // Act
      const linkElement = fixture.debugElement.query(By.css('a'));
      linkElement.triggerEventHandler('click', new MouseEvent('click'));

      // Assert
      expect(component.handleClick).toHaveBeenCalled();
    });
  });
});
