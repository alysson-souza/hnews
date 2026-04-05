// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    fixture.detectChanges();
  });

  function getCardBase(): HTMLElement {
    return fixture.debugElement.query(By.css('.card-base')).nativeElement as HTMLElement;
  }

  it('defaults to xl radius', () => {
    expect(getCardBase().classList.contains('card-radius-xl')).toBe(true);
    expect(getCardBase().classList.contains('card-radius-lg')).toBe(false);
  });

  it('applies lg radius when requested', () => {
    fixture.componentRef.setInput('radius', 'lg');
    fixture.detectChanges();

    expect(getCardBase().classList.contains('card-radius-lg')).toBe(true);
    expect(getCardBase().classList.contains('card-radius-xl')).toBe(false);
  });
});
