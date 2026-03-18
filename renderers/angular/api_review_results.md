# API Review Report - Angular v0.9 Renderer API Candidate

This report reviews the Angular Candidate API in `angular_v0_9/renderers/angular/src/v0_9` against the canonical API design principles and Angular v20+ best practices.

## Grade: **B+**

The API is well-structured, leveraging Angular Signals and providing a clean bridge to the underlying dynamic model from `@a2ui/web_core`. 

---

## Core Design - Analysis

### 1. Contract-First Design & Separation of Concerns
*   **Status**: **Strong**
*   **Details**: The use of `ComponentContext` and `BoundProperty` is an excellent execution of contract-first design. It abstracts the underlying Preact-based reactivity into an Angular-native format without exposing the inner workings to the consumer components.
*   **Repeats Exception**: Components like `RowComponent` and `ColumnComponent` do inspect the `raw` model structure directly (e.g., `props()['children']?.raw?.componentId`). While necessary for high-level structure logic like repeats, it creates a tight coupling to the wire representation.

### 2. KISS & Ergonomics
*   **Status**: **Good**
*   **Details**: Bundling properties into a single `props: Record<string, BoundProperty>` simplifies the generic bridge via `NgComponentOutlet` but degrades template Ergonomics slightly, causing developers to write `props()['prop']?.value()` repeatedly.

---

## Critical Issues
*   *None identified* - The architecture is sound and functional.

---

## Ergonomic Suggestions

### 1. Map `BoundProperty` Access to Component Variables (Computed Signals)
Currently, components access bound model properties in the template with:
`{{ props()['text']?.value() }}`

**To improve Ergonomics and better align with standard Angular architecture:** Component classes can define individual `computed()` signals for known properties. This encapsulates the `BoundProperty` structure within the component's TypeScript file and leaves the template clean and type-predictable.

#### **Code Example: `TextComponent`**

**Before:**
```typescript
@Component({
  selector: 'a2ui-v09-text',
  template: `
    <span
      [style.font-weight]="props()['weight']?.value()"
      [style.font-style]="props()['style']?.value()"
    >
      {{ props()['text']?.value() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextComponent {
  props = input<Record<string, BoundProperty>>({});
}
```

**After:**
```typescript
@Component({
  selector: 'a2ui-v09-text',
  template: `
    <span
      [style.font-weight]="fontWeight()"
      [style.font-style]="fontStyle()"
    >
      {{ text() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextComponent {
  props = input<Record<string, BoundProperty>>({});

  // Type-safe, intent-revealing definitions
  text = computed(() => this.props()['text']?.value() ?? '');
  fontWeight = computed(() => this.props()['weight']?.value() ?? 'normal');
  fontStyle = computed(() => this.props()['style']?.value() ?? 'normal');
}
```

---

## Technical Enhancements

### 1. Tighten Type Definition on `BoundProperty` in components
To prevent accessor guessing in templates or `computed` setups, specify types when declaring inputs or getters where statically feasible. 
*For example*: The repeating list logic in `Row` accesses `.raw.path` to generate child contexts. Moving that logic to a computed signal in class reduces template complexity to simple loops.
