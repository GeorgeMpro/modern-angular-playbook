import {Component, DebugElement} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {Highlight} from './highlight';

@Component({
  imports: [Highlight],
  template: `
    <h2 [appHighlight]="darkColor"
        defaultColor>
      Slate
    </h2>
    <h2 [appHighlight]="lightColor"
        defaultColor>
      Yellow
    </h2>
    <h2 appHighlight
        [defaultColor]="defaultColor">
      Default Provided
    </h2>
    <h2 appHighlight
        defaultColor>
      Default Manual (on empty string)
    </h2>
  `
})
class HighlightTestHost {
  protected readonly defaultColor = '#fecdd3';
  protected readonly darkColor = '#1e293b';
  protected readonly lightColor = '#fef08a';
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function expectColorRgb(actual: string, expected: string): void {
  expect(actual).toBe(hexToRgb(expected));
}

function triggerEvent<T>(
  de: DebugElement,
  fixture: ComponentFixture<T>,
  eventName: string): void {
  de.triggerEventHandler(eventName);
  fixture.detectChanges();
}

function getBackgroundAndFontColors(de: DebugElement): [string, string] {
  const bgColor = de.nativeElement.style.backgroundColor;
  const fontColor = de.nativeElement.style.color;

  return [bgColor, fontColor];
}

describe('Highlight', () => {
  let fixture: ComponentFixture<HighlightTestHost>;
  let des: DebugElement[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(HighlightTestHost);
    await fixture.whenStable();

    des = fixture.debugElement.queryAll(By.directive(Highlight));
  });

  it(`should have four highlighted elements`, () => {
    expect(des.length).toBe(4);
  });

  it(`should color 1st <h2> background "slate" and light font on mouse enter`, () => {
    const element = des[0];
    triggerEvent(element, fixture, 'mouseenter');

    const [bgColor, fontColor] = getBackgroundAndFontColors(element);

    expectColorRgb(bgColor, '#1e293b')
    expectColorRgb(fontColor, '#f3f4f6')
  });

  it(`should color 2nd <h2> background "yellow" and dark font on mouse enter`, () => {
    const element = des[1];

    triggerEvent(element, fixture, 'mouseenter');

    const [bgColor, fontColor] = getBackgroundAndFontColors(element);

    expectColorRgb(bgColor, '#fef08a');
    expectColorRgb(fontColor, '#111827');
  });

  it(`should color 3rd <h2> default background "rose"`, () => {
    const element = des[2];
    triggerEvent(element, fixture, 'mouseenter');

    const [bgColor] = getBackgroundAndFontColors(element);

    expectColorRgb(bgColor, '#fecdd3');
  });

  it(`should color 4th <h2> default manual background "yellow"`, () => {
    const element = des[3];
    triggerEvent(element, fixture, 'mouseenter');

    const [bgColor] = getBackgroundAndFontColors(element);

    expect(bgColor).toBe('yellow');
  });

  it(`should handle mouse leave`, () => {
    const element = des[0];
    triggerEvent(element, fixture, 'mouseenter');
    triggerEvent(element, fixture, 'mouseleave');
    const [bgColor, fontColor] = getBackgroundAndFontColors(element);

    expect(bgColor).toBe('');
    expect(fontColor).toBe('inherit');
  });
});
