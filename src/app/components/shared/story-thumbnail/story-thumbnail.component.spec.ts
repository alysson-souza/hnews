import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryThumbnailComponent } from './story-thumbnail.component';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

describe('StoryThumbnailComponent', () => {
  let component: StoryThumbnailComponent;
  let fixture: ComponentFixture<StoryThumbnailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryThumbnailComponent],
      providers: [
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) => {
            return config.src;
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryThumbnailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('storyTitle', 'Test Story');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show placeholder for text posts', () => {
    fixture.componentRef.setInput('storyTitle', 'Ask HN: Something');
    fixture.componentRef.setInput('isTextPost', true);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    const favicon = fixture.nativeElement.querySelector('app-story-favicon');

    expect(svg).toBeTruthy();
    expect(favicon).toBeFalsy();
  });

  it('should show favicon for link posts', () => {
    fixture.componentRef.setInput('storyTitle', 'Show HN: Something');
    fixture.componentRef.setInput('storyUrl', 'https://example.com');
    fixture.componentRef.setInput('isTextPost', false);
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg');
    const favicon = fixture.nativeElement.querySelector('app-story-favicon');

    expect(svg).toBeFalsy();
    expect(favicon).toBeTruthy();
  });

  it('should emit linkClicked event when clicked', () => {
    fixture.componentRef.setInput('storyTitle', 'Test Story');
    fixture.componentRef.setInput('storyUrl', 'https://example.com');
    fixture.detectChanges();

    let emitted = false;
    component.linkClicked.subscribe(() => (emitted = true));

    const link = fixture.nativeElement.querySelector('a');
    link.click();

    expect(emitted).toBe(true);
  });
});
