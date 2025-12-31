# Challenge #1: Signal Forms - Multi-Step Registration Wizard

**Difficulty:** Medium
**Time Estimate:** 2-3 hours
**Angular Version:** 21+
**New Feature:** Signal Forms (Experimental)

---

## 🎯 Learning Objectives

- Use the experimental `@angular/forms/signals` package
- Build multi-step form wizards with state persistence
- Implement cross-field validation with signals
- Work with signal-based form arrays (dynamic fields)
- Compare Signal Forms vs traditional Reactive Forms

---

## 📋 Requirements

### Core Features

**Step 1: Personal Information**
- First Name (required, min 2 characters)
- Last Name (required, min 2 characters)
- Email (required, valid email format)
- Phone Number (optional, format validation)
- Date of Birth (required, must be 18+)

**Step 2: Password Setup**
- Password (required, min 8 chars, must include: uppercase, lowercase, number, special char)
- Confirm Password (required, must match password)
- Security Question dropdown (required)
- Security Answer (required, min 3 characters)

**Step 3: Preferences**
- Newsletter subscription (checkbox)
- Interests (checkboxes: multiple selection from 5+ options)
- Bio (textarea, optional, max 500 characters)
- Profile visibility (radio: Public / Private / Friends Only)

### Technical Requirements

1. **Signal Forms Implementation**
   - Use `@angular/forms/signals` package
   - Signal-based form state management
   - Type-safe form models

2. **Multi-Step Navigation**
   - Next/Previous buttons
   - Step indicator (1/3, 2/3, 3/3)
   - Disable "Next" if current step invalid
   - Enable "Previous" on all steps except first
   - "Submit" button on final step

3. **Validation**
   - Real-time validation feedback
   - Cross-field validation (password match)
   - Custom validator for age 18+
   - Show validation errors below fields
   - Only show errors after field is touched

4. **State Persistence**
   - Save form progress to localStorage on each step change
   - Restore form state on page reload
   - Clear localStorage on successful submission

5. **User Experience**
   - Loading state during "submission" (mock API call)
   - Success message after submission
   - Form reset after successful submission
   - Accessibility (labels, ARIA attributes)

### Bonus Challenges

- [ ] Add a "Review & Submit" step showing all entered data
- [ ] Implement form array for "Add multiple phone numbers"
- [ ] Add smooth step transitions with animations
- [ ] Build the same wizard using traditional Reactive Forms and compare code
- [ ] Add progress bar (% complete based on filled fields)
- [ ] Implement auto-save (debounced, every 2 seconds)

---

## 🏗️ Implementation Guide

### 1. Setup

```bash
# Create new Angular 21 app
ng new signal-forms-challenge --standalone --routing=false

# Install signal forms (if not included by default)
npm install @angular/forms
```

### 2. Component Structure

```
src/app/
├── components/
│   ├── registration-wizard/
│   │   ├── registration-wizard.component.ts
│   │   ├── registration-wizard.component.html
│   │   ├── registration-wizard.component.scss
│   │   ├── steps/
│   │   │   ├── step-personal-info.component.ts
│   │   │   ├── step-password.component.ts
│   │   │   └── step-preferences.component.ts
│   └── step-indicator/
│       └── step-indicator.component.ts
├── models/
│   └── registration.model.ts
├── services/
│   └── registration.service.ts (for localStorage persistence)
└── validators/
    └── custom-validators.ts (age, password strength, etc.)
```

### 3. Signal Forms API Reference

```typescript
import { signal, computed } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms/signals';

// Example structure (API may vary - check Angular 21 docs)
const personalInfoForm = new FormGroup({
  firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
  lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
  email: new FormControl('', [Validators.required, Validators.email])
});

// Access form state as signals
const isValid = computed(() => personalInfoForm.valid());
const formValue = computed(() => personalInfoForm.value());
```

### 4. Multi-Step State Management

```typescript
// Example structure
export class RegistrationWizardComponent {
  currentStep = signal<1 | 2 | 3>(1);

  // Forms for each step
  step1Form = new FormGroup({...});
  step2Form = new FormGroup({...});
  step3Form = new FormGroup({...});

  // Computed properties
  canGoNext = computed(() => {
    const step = this.currentStep();
    if (step === 1) return this.step1Form.valid();
    if (step === 2) return this.step2Form.valid();
    return true;
  });

  nextStep() {
    if (this.canGoNext()) {
      this.saveProgress();
      this.currentStep.update(step => (step + 1) as 1 | 2 | 3);
    }
  }

  previousStep() {
    this.currentStep.update(step => (step - 1) as 1 | 2 | 3);
  }
}
```

### 5. Custom Validators

```typescript
// validators/custom-validators.ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  static age18Plus(control: AbstractControl): ValidationErrors | null {
    const birthDate = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    return age >= 18 ? null : { underage: { requiredAge: 18, actualAge: age } };
  }

  static passwordStrength(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecial;

    return valid ? null : {
      passwordStrength: {
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecial
      }
    };
  }

  static passwordMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
```

### 6. LocalStorage Persistence

```typescript
// services/registration.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly STORAGE_KEY = 'registration_wizard_progress';

  saveProgress(step: number, formData: any): void {
    const currentData = this.loadProgress() || {};
    currentData[`step${step}`] = formData;
    currentData.lastStep = step;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentData));
  }

  loadProgress(): any {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] All 3 steps render correctly with proper form controls
- [ ] Navigation works (Next/Previous/Submit)
- [ ] All validations work (built-in + custom)
- [ ] Password match validation works (cross-field)
- [ ] Age 18+ validation works
- [ ] Form state persists to localStorage
- [ ] Form restores from localStorage on reload
- [ ] Cannot proceed to next step if current step invalid
- [ ] Success message shows after submission
- [ ] Form resets and localStorage clears after submission

### Should Have
- [ ] Validation errors display clearly
- [ ] Errors only show after field touched/dirty
- [ ] Step indicator shows current progress
- [ ] Loading state during submission
- [ ] Accessible (labels, ARIA attributes)

### Nice to Have
- [ ] Smooth transitions between steps
- [ ] Review step showing all data
- [ ] Form arrays for dynamic fields
- [ ] Auto-save functionality
- [ ] Progress bar

---

## 🧪 Testing Strategy

Since this is a timed challenge, comprehensive tests are not expected. However, consider:

**Manual Testing Checklist:**
- [ ] Fill step 1, navigate to step 2, refresh page → data persists
- [ ] Enter mismatched passwords → error shows
- [ ] Enter date making user under 18 → error shows
- [ ] Leave required field empty → cannot proceed
- [ ] Complete all steps and submit → success message, localStorage cleared
- [ ] Test keyboard navigation (tab order)

**Optional Unit Tests:**
- Custom validators (age18Plus, passwordStrength, passwordMatch)
- Service methods (saveProgress, loadProgress, clearProgress)

---

## 📚 Resources

**Angular 21 Signal Forms:**
- [Angular v21 Announcement](https://blog.angular.dev/announcing-angular-v21-57946c34f14b)
- [What's New in Angular 21](https://www.angulararchitects.io/blog/whats-new-in-angular-21-signal-forms-zone-less-vitest-angular-aria-cli-with-mcp-server/)
- [Angular Forms Documentation](https://angular.dev/guide/forms)
- [Angular Signals Guide](https://angular.dev/guide/signals)

**Form Validation:**
- [Angular Validators](https://angular.dev/api/forms/Validators)
- [Custom Validators Guide](https://angular.dev/guide/forms/form-validation#custom-validators)

**LocalStorage:**
- [MDN - Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

## 🎓 Key Learnings

After completing this challenge, you should understand:

1. **Signal Forms API** - How to use the experimental signal-based forms
2. **Multi-step forms** - Managing state across multiple form steps
3. **Cross-field validation** - Validators that depend on multiple fields
4. **State persistence** - Saving/restoring form state with localStorage
5. **Type safety** - Signal forms provide better TypeScript support
6. **Modern Angular patterns** - Signals, computed values, effects

---

## 🔄 Comparison Challenge

After building with Signal Forms, optionally build the same wizard using **traditional Reactive Forms** and compare:

**Compare:**
- Lines of code
- Type safety
- Boilerplate
- Developer experience
- Performance
- Testability

**Document findings in a comparison table.**

---

## 💡 Hints & Tips

1. **Start simple** - Get one step working before adding multi-step logic
2. **Check the docs** - Signal Forms API might differ from examples (experimental)
3. **Type your models** - Create TypeScript interfaces for form data
4. **Validate early** - Test custom validators in isolation first
5. **Console.log liberally** - Check form state, validation errors, localStorage data
6. **Accessibility matters** - Use proper labels and ARIA attributes

---

## 🚀 Getting Started

1. Create new Angular 21 app
2. Check if `@angular/forms/signals` is available (may need to install separately)
3. Build Step 1 (Personal Info) first
4. Add validation and test thoroughly
5. Add multi-step navigation
6. Add Steps 2 and 3
7. Implement localStorage persistence
8. Polish UX and accessibility
9. Test thoroughly
10. (Optional) Build comparison with Reactive Forms

---

**Good luck! Remember: TDD mindset, baby steps, ship working code over perfect code.**
