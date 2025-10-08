// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserTagComponent } from './user-tag.component';
import { UserTagsService } from '../../services/user-tags.service';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

@Component({ template: '' })
class DummyComponent {}

describe('UserTagComponent', () => {
  let component: UserTagComponent;
  let fixture: ComponentFixture<UserTagComponent>;
  let tagsService: jasmine.SpyObj<UserTagsService>;

  beforeEach(async () => {
    const tagsServiceSpy = jasmine.createSpyObj('UserTagsService', [
      'getTag',
      'setTag',
      'removeTag',
    ]);

    await TestBed.configureTestingModule({
      imports: [UserTagComponent],
      providers: [
        { provide: UserTagsService, useValue: tagsServiceSpy },
        provideRouter([{ path: '**', component: DummyComponent }]),
        provideLocationMocks(),
      ],
    }).compileComponents();

    tagsService = TestBed.inject(UserTagsService) as jasmine.SpyObj<UserTagsService>;
    fixture = TestBed.createComponent(UserTagComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('username input', () => {
    it('should set username and load tag', () => {
      const mockTag = {
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tagsService.getTag.and.returnValue(mockTag);

      component.username = 'testuser';
      fixture.detectChanges();

      expect(component.username).toBe('testuser');
      expect(tagsService.getTag).toHaveBeenCalledWith('testuser');
      expect(component.tag()).toEqual(mockTag);
    });

    it('should update tag when username changes', () => {
      const mockTag1 = {
        username: 'user1',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const mockTag2 = {
        username: 'user2',
        tag: 'author',
        color: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      tagsService.getTag.and.returnValue(mockTag1);
      component.username = 'user1';
      fixture.detectChanges();

      tagsService.getTag.and.returnValue(mockTag2);
      component.username = 'user2';
      fixture.detectChanges();

      expect(tagsService.getTag).toHaveBeenCalledWith('user2');
      expect(component.tag()).toEqual(mockTag2);
    });

    it('should handle username without tag', () => {
      tagsService.getTag.and.returnValue(undefined);

      component.username = 'newuser';
      fixture.detectChanges();

      expect(component.tag()).toBeUndefined();
    });
  });

  describe('startEdit', () => {
    beforeEach(() => {
      component.username = 'testuser';
      fixture.detectChanges();
    });

    it('should start editing mode', () => {
      const event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');

      component.startEdit(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.editing()).toBe(true);
    });

    it('should populate editValue with existing tag', () => {
      const mockTag = {
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      component.tag.set(mockTag);

      const event = new Event('click');
      component.startEdit(event);

      expect(component.editValue).toBe('friend');
    });

    it('should use empty string when no existing tag', () => {
      component.tag.set(undefined);

      const event = new Event('click');
      component.startEdit(event);

      expect(component.editValue).toBe('');
    });
  });

  describe('saveTag', () => {
    beforeEach(() => {
      component.username = 'testuser';
      tagsService.getTag.and.returnValue(undefined);
      fixture.detectChanges();
    });

    it('should save non-empty tag', () => {
      const newTag = {
        username: 'testuser',
        tag: 'colleague',
        color: '#0000ff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      tagsService.getTag.and.returnValue(newTag);
      component.editValue = 'colleague';
      component.editing.set(true);

      component.saveTag();

      expect(tagsService.setTag).toHaveBeenCalledWith('testuser', 'colleague');
      expect(component.editing()).toBe(false);
      expect(component.editValue).toBe('');
    });

    it('should trim whitespace before saving', () => {
      component.editValue = '  friend  ';
      component.editing.set(true);

      component.saveTag();

      expect(tagsService.setTag).toHaveBeenCalledWith('testuser', 'friend');
    });

    it('should remove tag when saving empty value and tag exists', () => {
      component.tag.set({
        username: 'testuser',
        tag: 'old',
        color: '#ff0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      component.editValue = '   ';
      component.editing.set(true);

      component.saveTag();

      expect(tagsService.removeTag).toHaveBeenCalledWith('testuser');
      expect(component.tag()).toBeUndefined();
      expect(component.editing()).toBe(false);
    });

    it('should not save when value is empty and no existing tag', () => {
      component.tag.set(undefined);
      component.editValue = '';
      component.editing.set(true);

      component.saveTag();

      expect(tagsService.setTag).not.toHaveBeenCalled();
      expect(tagsService.removeTag).not.toHaveBeenCalled();
      expect(component.editing()).toBe(false);
    });
  });

  describe('removeTag', () => {
    beforeEach(() => {
      component.username = 'testuser';
      fixture.detectChanges();
    });

    it('should remove tag and exit editing mode', () => {
      component.tag.set({
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      component.editing.set(true);
      component.editValue = 'friend';

      component.removeTag();

      expect(tagsService.removeTag).toHaveBeenCalledWith('testuser');
      expect(component.tag()).toBeUndefined();
      expect(component.editing()).toBe(false);
      expect(component.editValue).toBe('');
    });
  });

  describe('cancelEdit', () => {
    it('should cancel editing and clear editValue', () => {
      component.editing.set(true);
      component.editValue = 'temp';

      component.cancelEdit();

      expect(component.editing()).toBe(false);
      expect(component.editValue).toBe('');
    });
  });

  describe('onInputBlur', () => {
    it('should cancel edit after delay', fakeAsync(() => {
      component.editing.set(true);
      component.editValue = 'test';

      component.onInputBlur();

      expect(component.editing()).toBe(true);

      tick(100);

      expect(component.editing()).toBe(false);
    }));

    it('should not cancel if already not editing', fakeAsync(() => {
      component.editing.set(false);
      spyOn(component, 'cancelEdit');

      component.onInputBlur();
      tick(100);

      expect(component.cancelEdit).not.toHaveBeenCalled();
    }));
  });

  describe('template rendering', () => {
    beforeEach(() => {
      tagsService.getTag.and.returnValue(undefined);
      component.username = 'testuser';
      fixture.detectChanges();
    });

    it('should render username link', () => {
      const link = fixture.debugElement.query(By.css('.username-link'));
      expect(link).toBeTruthy();
      expect(link.nativeElement.textContent.trim()).toBe('testuser');
    });

    it('should render add button when no tag exists', () => {
      component.tag.set(undefined);
      fixture.detectChanges();

      const addBtn = fixture.debugElement.query(By.css('.add-btn'));
      expect(addBtn).toBeTruthy();
    });

    it('should render tag chip when tag exists', () => {
      const mockTag = {
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      component.tag.set(mockTag);
      fixture.detectChanges();

      const tagChip = fixture.debugElement.query(By.css('.tag-chip'));
      expect(tagChip).toBeTruthy();
      expect(tagChip.nativeElement.textContent.trim()).toBe('friend');
      expect(tagChip.nativeElement.style.backgroundColor).toBe('rgb(0, 255, 0)');
    });

    it('should show editor when editing', () => {
      component.editing.set(true);
      fixture.detectChanges();

      const editor = fixture.debugElement.query(By.css('.editor'));
      const input = fixture.debugElement.query(By.css('.tag-input'));
      const saveBtn = fixture.debugElement.query(By.css('.save-btn'));

      expect(editor).toBeTruthy();
      expect(input).toBeTruthy();
      expect(saveBtn).toBeTruthy();
    });

    it('should show remove button in editor when tag exists', () => {
      component.tag.set({
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      component.editing.set(true);
      fixture.detectChanges();

      const removeBtn = fixture.debugElement.query(By.css('.remove-btn'));
      expect(removeBtn).toBeTruthy();
    });

    it('should not show remove button when no tag exists', () => {
      component.tag.set(undefined);
      component.editing.set(true);
      fixture.detectChanges();

      const removeBtn = fixture.debugElement.query(By.css('.remove-btn'));
      expect(removeBtn).toBeFalsy();
    });
  });

  describe('interaction', () => {
    beforeEach(() => {
      tagsService.getTag.and.returnValue(undefined);
      component.username = 'testuser';
      fixture.detectChanges();
    });

    it('should start editing when add button is clicked', () => {
      component.tag.set(undefined);
      fixture.detectChanges();

      const addBtn = fixture.debugElement.query(By.css('.add-btn'));
      addBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.editing()).toBe(true);
    });

    it('should start editing when tag chip is clicked', () => {
      component.tag.set({
        username: 'testuser',
        tag: 'friend',
        color: '#00ff00',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      fixture.detectChanges();

      const tagChip = fixture.debugElement.query(By.css('.tag-chip'));
      tagChip.nativeElement.click();
      fixture.detectChanges();

      expect(component.editing()).toBe(true);
    });
  });
});
