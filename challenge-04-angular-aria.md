# Challenge #4: Angular ARIA - Accessible Component Library

**Difficulty:** Medium-Hard
**Time Estimate:** 2-3 hours
**Angular Version:** 21+
**New Feature:** @angular/aria package

---

## 🎯 Learning Objectives

- Use the new `@angular/aria` package directives
- Implement WAI-ARIA design patterns correctly
- Master keyboard navigation (Tab, Arrow keys, Escape, Enter, Space)
- Understand focus management and focus trapping
- Test with real screen readers (NVDA, JAWS, VoiceOver)
- Compare manual ARIA vs @angular/aria implementation
- Learn WCAG 2.1 AA compliance requirements

---

## 📋 Requirements

### Core Components to Build

**1. Custom Dropdown (Combobox)**
- Trigger button opens/closes dropdown
- Arrow keys navigate options
- Enter/Space selects option
- Escape closes dropdown
- Type-ahead search (type to filter)
- ARIA roles: `combobox`, `listbox`, `option`
- Focus returns to trigger after selection

**2. Modal Dialog**
- Focus trap (Tab cycles within modal only)
- Escape key closes modal
- Focus returns to trigger element after close
- Background inert (cannot interact with page behind modal)
- ARIA roles: `dialog`, `aria-labelledby`, `aria-describedby`
- Close button and backdrop click to close

**3. Tabs Component**
- Arrow Left/Right navigate tabs
- Home/End jump to first/last tab
- Tab key moves focus out of tab list
- ARIA roles: `tablist`, `tab`, `tabpanel`
- `aria-selected`, `aria-controls`
- Only active tab in tab order (tabindex management)

**4. Accordion**
- Enter/Space toggles panel
- Arrow Up/Down navigate headers (optional)
- Multiple panels can be open (not exclusive)
- ARIA roles: `region`, `button`, `aria-expanded`
- Focus visible indicator
- Smooth expand/collapse transitions

### Technical Requirements

1. **@angular/aria Package Usage**
   ```typescript
   import { AriaDescriber, FocusTrap } from '@angular/aria';
   ```

2. **Keyboard Navigation**
   - All components fully keyboard accessible
   - No keyboard traps (except intentional focus trap in modal)
   - Visible focus indicators
   - Logical tab order

3. **ARIA Attributes**
   - Proper roles (`role="dialog"`, `role="tablist"`, etc.)
   - State attributes (`aria-expanded`, `aria-selected`, `aria-hidden`)
   - Relationship attributes (`aria-labelledby`, `aria-controls`, `aria-describedby`)
   - Live regions for dynamic content (`aria-live`, `aria-atomic`)

4. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - All interactive elements announced correctly
   - State changes announced
   - Context provided for controls

5. **Focus Management**
   - Focus visible at all times
   - Focus restored after modals/dropdowns close
   - Skip links for keyboard navigation
   - No focus on hidden elements

### Bonus Challenges

- [ ] Add tooltip component with `aria-describedby`
- [ ] Implement roving tabindex for toolbar
- [ ] Add live region announcements for dynamic updates
- [ ] Build menu button (nested menus)
- [ ] Implement breadcrumb navigation with proper semantics
- [ ] Add visual focus indicators that meet WCAG contrast ratios
- [ ] Build the same components WITHOUT @angular/aria and compare
- [ ] Add automated accessibility tests (axe-core, jest-axe)
- [ ] Create accessibility documentation/style guide

---

## 🏗️ Implementation Guide

### 1. Setup

```bash
# Create new Angular 21 app
ng new aria-components --standalone

cd aria-components

# @angular/aria should be included in Angular 21
# If not, install it:
npm install @angular/aria
```

### 2. Component Structure

```
src/app/
├── components/
│   ├── dropdown/
│   │   ├── dropdown.component.ts
│   │   ├── dropdown.component.html
│   │   └── dropdown.component.scss
│   ├── modal/
│   │   ├── modal.component.ts
│   │   ├── modal.component.html
│   │   └── modal.component.scss
│   ├── tabs/
│   │   ├── tabs.component.ts
│   │   ├── tab.component.ts
│   │   ├── tab-panel.component.ts
│   │   └── tabs.component.scss
│   ├── accordion/
│   │   ├── accordion.component.ts
│   │   ├── accordion-item.component.ts
│   │   └── accordion.component.scss
│   └── demo/
│       └── demo-page.component.ts (showcase all components)
├── directives/
│   └── focus-trap.directive.ts (if not using @angular/aria)
└── services/
    └── aria-announcer.service.ts (for live regions)
```

### 3. Dropdown Component Example

```typescript
// dropdown.component.ts
import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dropdown">
      <button
        #triggerBtn
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-controls]="'dropdown-list'"
        (click)="toggle()"
        (keydown)="onTriggerKeyDown($event)"
        class="dropdown-trigger">
        {{ selectedOption() || 'Select an option' }}
        <span class="arrow">▼</span>
      </button>

      @if (isOpen()) {
        <ul
          id="dropdown-list"
          role="listbox"
          [attr.aria-labelledby]="'dropdown-trigger'"
          class="dropdown-list">
          @for (option of options; track option.id; let i = $index) {
            <li
              role="option"
              [attr.aria-selected]="selectedOption() === option.label"
              [class.focused]="focusedIndex() === i"
              (click)="selectOption(option)"
              (mouseenter)="setFocusedIndex(i)"
              class="dropdown-option">
              {{ option.label }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .dropdown {
      position: relative;
      width: 300px;
    }

    .dropdown-trigger {
      width: 100%;
      padding: 12px;
      border: 2px solid #ccc;
      background: white;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dropdown-trigger:focus {
      outline: 2px solid #4A90E2;
      outline-offset: 2px;
    }

    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin: 4px 0;
      padding: 0;
      list-style: none;
      border: 2px solid #ccc;
      background: white;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
    }

    .dropdown-option {
      padding: 12px;
      cursor: pointer;
    }

    .dropdown-option:hover,
    .dropdown-option.focused {
      background: #f0f0f0;
    }

    .dropdown-option[aria-selected="true"] {
      background: #4A90E2;
      color: white;
    }
  `]
})
export class DropdownComponent {
  isOpen = signal(false);
  selectedOption = signal<string | null>(null);
  focusedIndex = signal(0);

  options = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' },
    { id: 4, label: 'Option 4' },
    { id: 5, label: 'Option 5' }
  ];

  toggle() {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      this.focusedIndex.set(0);
    }
  }

  selectOption(option: any) {
    this.selectedOption.set(option.label);
    this.isOpen.set(false);
    // Focus should return to trigger button
  }

  setFocusedIndex(index: number) {
    this.focusedIndex.set(index);
  }

  onTriggerKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.isOpen.set(true);
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.isOpen()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.update(i =>
          Math.min(i + 1, this.options.length - 1)
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.update(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectOption(this.options[this.focusedIndex()]);
        break;
      case 'Escape':
        event.preventDefault();
        this.isOpen.set(false);
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    // Close dropdown if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.isOpen.set(false);
    }
  }
}
```

### 4. Modal Component with Focus Trap

```typescript
// modal.component.ts
import { Component, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="close()">
        <div
          #modalContent
          role="dialog"
          [attr.aria-modal]="true"
          [attr.aria-labelledby]="'modal-title'"
          [attr.aria-describedby]="'modal-description'"
          class="modal-content"
          (click)="$event.stopPropagation()">

          <h2 id="modal-title">{{ title }}</h2>
          <p id="modal-description">{{ description }}</p>

          <div class="modal-body">
            <ng-content></ng-content>
          </div>

          <div class="modal-actions">
            <button (click)="close()" class="btn-primary">OK</button>
            <button (click)="close()" class="btn-secondary">Cancel</button>
          </div>

          <button
            (click)="close()"
            aria-label="Close modal"
            class="close-btn">
            ✕
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      position: relative;
    }

    .modal-content:focus {
      outline: none;
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
    }

    .close-btn:focus {
      outline: 2px solid #4A90E2;
      outline-offset: 2px;
    }

    .modal-actions {
      margin-top: 24px;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: #4A90E2;
      color: white;
    }

    .btn-secondary {
      background: #ccc;
    }

    button:focus {
      outline: 2px solid #4A90E2;
      outline-offset: 2px;
    }
  `]
})
export class ModalComponent implements AfterViewInit {
  @ViewChild('modalContent') modalContent!: ElementRef;

  isOpen = signal(false);
  title = 'Modal Title';
  description = 'This is a modal dialog';

  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  open() {
    this.previousActiveElement = document.activeElement as HTMLElement;
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    // Restore focus to element that opened modal
    this.previousActiveElement?.focus();
  }

  ngAfterViewInit() {
    if (this.isOpen()) {
      this.setupFocusTrap();
    }
  }

  setupFocusTrap() {
    // Find all focusable elements in modal
    const modal = this.modalContent.nativeElement;
    this.focusableElements = Array.from(
      modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );

    // Focus first element
    setTimeout(() => {
      this.focusableElements[0]?.focus();
    });

    // Trap focus within modal
    document.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    }
  };
}
```

### 5. Tabs Component

```typescript
// tabs.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tab {
  id: string;
  label: string;
  content: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs">
      <div role="tablist" aria-label="Sample Tabs" class="tab-list">
        @for (tab of tabs; track tab.id; let i = $index) {
          <button
            role="tab"
            [attr.id]="'tab-' + tab.id"
            [attr.aria-selected]="activeTabIndex() === i"
            [attr.aria-controls]="'panel-' + tab.id"
            [attr.tabindex]="activeTabIndex() === i ? 0 : -1"
            (click)="selectTab(i)"
            (keydown)="onTabKeyDown($event, i)"
            class="tab">
            {{ tab.label }}
          </button>
        }
      </div>

      @for (tab of tabs; track tab.id; let i = $index) {
        <div
          role="tabpanel"
          [attr.id]="'panel-' + tab.id"
          [attr.aria-labelledby]="'tab-' + tab.id"
          [attr.hidden]="activeTabIndex() !== i ? true : null"
          [attr.tabindex]="0"
          class="tab-panel">
          {{ tab.content }}
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-list {
      display: flex;
      border-bottom: 2px solid #ccc;
    }

    .tab {
      padding: 12px 24px;
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 16px;
    }

    .tab[aria-selected="true"] {
      border-bottom-color: #4A90E2;
      font-weight: bold;
    }

    .tab:focus {
      outline: 2px solid #4A90E2;
      outline-offset: -2px;
    }

    .tab-panel {
      padding: 24px;
    }

    .tab-panel:focus {
      outline: 2px solid #4A90E2;
      outline-offset: -2px;
    }
  `]
})
export class TabsComponent {
  activeTabIndex = signal(0);

  tabs: Tab[] = [
    { id: '1', label: 'Tab 1', content: 'Content for Tab 1' },
    { id: '2', label: 'Tab 2', content: 'Content for Tab 2' },
    { id: '3', label: 'Tab 3', content: 'Content for Tab 3' }
  ];

  selectTab(index: number) {
    this.activeTabIndex.set(index);
  }

  onTabKeyDown(event: KeyboardEvent, currentIndex: number) {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }

    this.selectTab(newIndex);
    // Focus the newly selected tab
    setTimeout(() => {
      const tabElement = document.getElementById(`tab-${this.tabs[newIndex].id}`);
      tabElement?.focus();
    });
  }
}
```

### 6. Accordion Component

```typescript
// accordion-item.component.ts
import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accordion-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="accordion-item">
      <h3>
        <button
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-controls]="'panel-' + id"
          [attr.id]="'header-' + id"
          (click)="toggle()"
          class="accordion-header">
          <span>{{ title }}</span>
          <span class="icon">{{ isExpanded() ? '−' : '+' }}</span>
        </button>
      </h3>

      <div
        [attr.id]="'panel-' + id"
        [attr.aria-labelledby]="'header-' + id"
        role="region"
        [attr.hidden]="!isExpanded() ? true : null"
        class="accordion-panel"
        [@slideDown]="isExpanded() ? 'expanded' : 'collapsed'">
        <div class="accordion-content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accordion-item {
      border: 1px solid #ccc;
      margin-bottom: 8px;
    }

    .accordion-header {
      width: 100%;
      padding: 16px;
      background: #f5f5f5;
      border: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      font-weight: bold;
    }

    .accordion-header:hover {
      background: #e0e0e0;
    }

    .accordion-header:focus {
      outline: 2px solid #4A90E2;
      outline-offset: -2px;
    }

    .accordion-panel {
      overflow: hidden;
    }

    .accordion-content {
      padding: 16px;
    }

    .icon {
      font-size: 20px;
      font-weight: bold;
    }
  `]
})
export class AccordionItemComponent {
  @Input() title = '';
  @Input() id = '';

  isExpanded = signal(false);

  toggle() {
    this.isExpanded.update(expanded => !expanded);
  }
}
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Dropdown navigates with Arrow keys, selects with Enter/Space
- [ ] Modal traps focus (Tab cycles within modal only)
- [ ] Modal closes on Escape and restores focus
- [ ] Tabs navigate with Arrow keys, Home/End
- [ ] Accordion toggles with Enter/Space
- [ ] All components have proper ARIA roles
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all elements
- [ ] Screen reader announces all interactions

### Should Have
- [ ] Type-ahead search in dropdown
- [ ] Backdrop click closes modal
- [ ] Smooth transitions in accordion
- [ ] Focus indicators meet WCAG contrast requirements
- [ ] No accessibility errors in axe DevTools

### Nice to Have
- [ ] Automated accessibility tests
- [ ] Comparison with manual ARIA implementation
- [ ] Additional components (tooltip, menu, breadcrumb)
- [ ] Accessibility documentation
- [ ] Dark mode with accessible colors

---

## 🧪 Testing Strategy

**Screen Reader Testing:**
- [ ] NVDA (Windows) - Download from nvaccess.org
- [ ] VoiceOver (Mac) - Built-in (Cmd+F5)
- [ ] JAWS (Windows) - Trial version

**Test Checklist:**
- [ ] All buttons announced as buttons
- [ ] State changes announced (expanded/collapsed)
- [ ] Tab labels and panels associated correctly
- [ ] Modal announced as dialog
- [ ] Focus moves logically
- [ ] No focus on hidden elements

**Automated Testing:**
```bash
# Install axe-core
npm install --save-dev axe-core @axe-core/playwright

# Run automated accessibility tests
```

---

## 📚 Resources

**Angular ARIA:**
- [Angular v21 ARIA Package](https://www.angulararchitects.io/blog/whats-new-in-angular-21-signal-forms-zone-less-vitest-angular-aria-cli-with-mcp-server/)
- [Angular Accessibility Guide](https://angular.dev/best-practices/a11y)

**WAI-ARIA Patterns:**
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
- [Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

**WCAG Guidelines:**
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)

**Tools:**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

---

## 🎓 Key Learnings

After completing this challenge, you should understand:

1. **@angular/aria package** - New Angular 21 accessibility primitives
2. **Keyboard navigation** - Arrow keys, Tab, Enter, Space, Escape
3. **Focus management** - Focus trapping, restoration, visible indicators
4. **ARIA roles and attributes** - Proper semantic markup
5. **Screen reader testing** - How to test with NVDA/VoiceOver
6. **WCAG compliance** - Legal accessibility requirements

---

## 💡 Hints & Tips

1. **Test with keyboard first** - Unplug your mouse
2. **Use Chrome DevTools** - Accessibility tab shows ARIA tree
3. **Install axe DevTools** - Catches 57% of accessibility issues
4. **Read WAI-ARIA patterns** - Don't reinvent the wheel
5. **Focus visible** - Use `:focus` and `:focus-visible` pseudo-classes
6. **Test with real screen readers** - Only way to truly validate
7. **Roving tabindex** - Only one element in group should be tabbable
8. **Don't overuse ARIA** - Use semantic HTML first

---

## 🚀 Getting Started

1. Create new Angular 21 app
2. Install @angular/aria (if needed)
3. Build dropdown component first
4. Test with keyboard only
5. Add ARIA attributes
6. Test with screen reader
7. Repeat for modal, tabs, accordion
8. Run automated accessibility tests
9. Document findings
10. (Optional) Compare with manual ARIA implementation

---

**Remember: Accessibility is not optional. It's a legal requirement and the right thing to do!**
