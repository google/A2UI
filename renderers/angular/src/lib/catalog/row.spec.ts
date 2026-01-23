import {describe, beforeEach, expect, it} from 'vitest';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import { Row } from './row.js';
import { Theme } from '../rendering/theming.js';

describe('Row', () => {
  let component: Row;
  let fixture: ComponentFixture<Row>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Row],
      providers: [
        {
          provide: Theme,
          useValue: {
            components: {
              Row: {},
            },
            additionalStyles: {},
          },
        },
      ],
    });
    fixture = TestBed.createComponent(Row);
    fixture.componentRef.setInput('weight', 1);
    fixture.componentRef.setInput('surfaceId', 'surface-1');
    fixture.componentRef.setInput('component', {
      id: 'test-row',
      type: 'Row',
      properties: { children: [] },
      dataContextPath: [],
    });
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render correctly', () => {
    const sectionElement = fixture.nativeElement.querySelector('section');
    expect(sectionElement).not.toBeNull();
    expect(sectionElement.getAttribute('style')).toBe(null);
    expect(sectionElement.classList.contains('align-stretch')).toBe(true);
    expect(sectionElement.classList.contains('distribute-start')).toBe(true);
  });

  it('should respect alignment input', () => {
    fixture.componentRef.setInput('alignment', 'center');
    fixture.detectChanges();
    const sectionElement = fixture.nativeElement.querySelector('section');
    expect(sectionElement.classList.contains('align-center')).toBe(true);
    expect(sectionElement.classList.contains('distribute-start')).toBe(true);
  });

  it('should respect distribution input', () => {
    fixture.componentRef.setInput('distribution', 'spaceBetween');
    fixture.detectChanges();
    const sectionElement = fixture.nativeElement.querySelector('section');
    expect(sectionElement.classList.contains('align-stretch')).toBe(true);
    expect(sectionElement.classList.contains('distribute-spaceBetween')).toBe(true);
  });

  it('should set host attributes correctly', () => {
    fixture.componentRef.setInput('alignment', 'end');
    fixture.componentRef.setInput('distribution', 'center');
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('alignment')).toBe('end');
    expect(fixture.nativeElement.getAttribute('distribution')).toBe('center');
  });
});
