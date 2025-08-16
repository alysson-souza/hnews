// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentThread } from './comment-thread';

describe('CommentThread', () => {
  let component: CommentThread;
  let fixture: ComponentFixture<CommentThread>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentThread],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentThread);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
