# Challenge #10: Advanced Forms - Dynamic Forms & Complex Validation

**Difficulty:** Medium-Hard
**Time Estimate:** 3-4 hours
**Focus:** Real-world form patterns you'll actually use

---

## 🎯 Learning Objectives

- Build dynamic forms (add/remove fields at runtime)
- Use FormArray for repeating groups
- Implement custom validators (sync + async)
- Cross-field validation (password match, date ranges)
- Conditional fields (show/hide based on other fields)
- Handle nested forms (address, contact info)
- Implement form state management
- Save/restore form state from localStorage
- Handle file uploads in forms

---

## 📋 The Challenge

Build a **Job Application Form** with these advanced patterns:

### Form Structure

**Personal Information:**
- First Name, Last Name (required)
- Email (required, valid email, async check if exists)
- Phone (optional, format validation)
- Date of Birth (required, must be 18+)

**Address (Nested FormGroup):**
- Street, City, State, Zip Code
- Country dropdown

**Work Experience (FormArray - add/remove):**
- Company Name
- Position
- Start Date, End Date
- Current Job checkbox (if checked, no end date)
- Description

**Skills (FormArray):**
- Skill Name
- Proficiency Level (1-5)
- Add/Remove skills dynamically

**References (FormArray):**
- Name, Email, Phone, Relationship
- Minimum 2 references required

**Additional:**
- Resume upload (PDF only, max 5MB)
- Cover Letter (textarea, optional)
- Consent checkbox (required)

---

## 🏗️ Implementation Guide

### 1. Basic Form Structure

```typescript
// job-application.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomValidators } from './custom-validators';

@Component({
  selector: 'app-job-application',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './job-application.component.html'
})
export class JobApplicationComponent implements OnInit {
  applicationForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
    this.restoreFormState();
    this.watchFormChanges();
  }

  private buildForm(): void {
    this.applicationForm = this.fb.group({
      personalInfo: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['',
          [Validators.required, Validators.email],
          [CustomValidators.emailExists()] // Async validator
        ],
        phone: ['', [CustomValidators.phoneFormat()]],
        dateOfBirth: ['', [Validators.required, CustomValidators.minimumAge(18)]]
      }),

      address: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        country: ['USA', Validators.required]
      }),

      workExperience: this.fb.array([
        this.createWorkExperienceGroup()
      ]),

      skills: this.fb.array([]),

      references: this.fb.array(
        [this.createReferenceGroup(), this.createReferenceGroup()],
        [Validators.minLength(2)]
      ),

      resume: [null, [Validators.required, CustomValidators.fileType(['pdf'])]],
      coverLetter: [''],
      consent: [false, Validators.requiredTrue]
    });
  }

  // Getters for FormArrays
  get workExperience(): FormArray {
    return this.applicationForm.get('workExperience') as FormArray;
  }

  get skills(): FormArray {
    return this.applicationForm.get('skills') as FormArray;
  }

  get references(): FormArray {
    return this.applicationForm.get('references') as FormArray;
  }

  // Create FormGroup for work experience
  private createWorkExperienceGroup(): FormGroup {
    return this.fb.group({
      company: ['', Validators.required],
      position: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      currentJob: [false],
      description: ['']
    }, {
      validators: [CustomValidators.dateRange('startDate', 'endDate')]
    });
  }

  // Create FormGroup for skill
  private createSkillGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      proficiency: [3, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  // Create FormGroup for reference
  private createReferenceGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      relationship: ['', Validators.required]
    });
  }

  // Add work experience
  addWorkExperience(): void {
    this.workExperience.push(this.createWorkExperienceGroup());
  }

  // Remove work experience
  removeWorkExperience(index: number): void {
    if (this.workExperience.length > 1) {
      this.workExperience.removeAt(index);
    }
  }

  // Add skill
  addSkill(): void {
    this.skills.push(this.createSkillGroup());
  }

  // Remove skill
  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  // Add reference
  addReference(): void {
    this.references.push(this.createReferenceGroup());
  }

  // Remove reference
  removeReference(index: number): void {
    if (this.references.length > 2) {
      this.references.removeAt(index);
    }
  }

  // Handle file upload
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.applicationForm.patchValue({ resume: file });
      this.applicationForm.get('resume')?.updateValueAndValidity();
    }
  }

  // Watch for form changes and save to localStorage
  private watchFormChanges(): void {
    this.applicationForm.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(value => {
      this.saveFormState();
    });
  }

  // Save form state to localStorage
  private saveFormState(): void {
    const formValue = this.applicationForm.getRawValue();
    localStorage.setItem('jobApplicationDraft', JSON.stringify(formValue));
  }

  // Restore form state from localStorage
  private restoreFormState(): void {
    const saved = localStorage.getItem('jobApplicationDraft');
    if (saved) {
      const formValue = JSON.parse(saved);
      this.applicationForm.patchValue(formValue);
    }
  }

  // Submit form
  onSubmit(): void {
    if (this.applicationForm.valid) {
      console.log('Form submitted:', this.applicationForm.value);
      localStorage.removeItem('jobApplicationDraft');
      // Send to API
    } else {
      this.markAllAsTouched();
    }
  }

  // Mark all fields as touched to show validation errors
  private markAllAsTouched(): void {
    Object.keys(this.applicationForm.controls).forEach(key => {
      const control = this.applicationForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markGroupAsTouched(control);
      }
    });
  }

  private markGroupAsTouched(group: FormGroup | FormArray): void {
    Object.keys((group as any).controls).forEach(key => {
      const control = group.get(key.toString());
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markGroupAsTouched(control);
      }
    });
  }
}
```

---

### 2. Custom Validators

```typescript
// custom-validators.ts
import { AbstractControl, ValidationErrors, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export class CustomValidators {
  // Minimum age validator
  static minimumAge(minAge: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= minAge ? null : {
        minimumAge: {
          requiredAge: minAge,
          actualAge: age
        }
      };
    };
  }

  // Phone format validator (US format)
  static phoneFormat(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      return phoneRegex.test(control.value) ? null : { phoneFormat: true };
    };
  }

  // Date range validator (cross-field)
  static dateRange(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;
      const currentJob = control.get('currentJob')?.value;

      // If current job, no end date required
      if (currentJob) return null;

      if (!startDate || !endDate) return null;

      const start = new Date(startDate);
      const end = new Date(endDate);

      return start < end ? null : { dateRange: true };
    };
  }

  // File type validator
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (!file) return null;

      const extension = file.name.split('.').pop()?.toLowerCase();
      const isValid = extension && allowedTypes.includes(extension);

      return isValid ? null : {
        fileType: {
          allowedTypes: allowedTypes,
          actualType: extension
        }
      };
    };
  }

  // File size validator (in MB)
  static fileSize(maxSizeMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (!file) return null;

      const fileSizeMB = file.size / (1024 * 1024);
      return fileSizeMB <= maxSizeMB ? null : {
        fileSize: {
          maxSize: maxSizeMB,
          actualSize: fileSizeMB.toFixed(2)
        }
      };
    };
  }

  // Async email exists validator (mock API call)
  static emailExists(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      // Simulate API call
      return of(control.value).pipe(
        delay(1000),
        map(email => {
          // Mock check - in real app, call API
          const existingEmails = ['taken@example.com', 'admin@example.com'];
          const exists = existingEmails.includes(email);

          return exists ? { emailExists: true } : null;
        })
      );
    };
  }

  // Password match validator (for password confirmation)
  static passwordMatch(passwordField: string, confirmField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField)?.value;
      const confirm = control.get(confirmField)?.value;

      if (!password || !confirm) return null;

      return password === confirm ? null : { passwordMismatch: true };
    };
  }
}
```

---

### 3. Template with FormArray

```html
<!-- job-application.component.html -->
<form [formGroup]="applicationForm" (ngSubmit)="onSubmit()">

  <!-- Personal Information -->
  <section formGroupName="personalInfo">
    <h2>Personal Information</h2>

    <div class="form-group">
      <label>First Name *</label>
      <input formControlName="firstName" type="text" />
      <div class="error" *ngIf="applicationForm.get('personalInfo.firstName')?.invalid &&
                                 applicationForm.get('personalInfo.firstName')?.touched">
        First name is required (min 2 characters)
      </div>
    </div>

    <div class="form-group">
      <label>Last Name *</label>
      <input formControlName="lastName" type="text" />
    </div>

    <div class="form-group">
      <label>Email *</label>
      <input formControlName="email" type="email" />

      <!-- Show loading during async validation -->
      <span *ngIf="applicationForm.get('personalInfo.email')?.pending">
        Checking email...
      </span>

      <div class="error" *ngIf="applicationForm.get('personalInfo.email')?.hasError('emailExists')">
        This email is already registered
      </div>
    </div>

    <div class="form-group">
      <label>Date of Birth *</label>
      <input formControlName="dateOfBirth" type="date" />
      <div class="error" *ngIf="applicationForm.get('personalInfo.dateOfBirth')?.hasError('minimumAge')">
        You must be at least 18 years old
      </div>
    </div>
  </section>

  <!-- Work Experience (FormArray) -->
  <section formArrayName="workExperience">
    <h2>Work Experience</h2>

    <div *ngFor="let experience of workExperience.controls; let i = index"
         [formGroupName]="i"
         class="array-item">

      <h3>Position {{ i + 1 }}</h3>

      <div class="form-group">
        <label>Company *</label>
        <input formControlName="company" type="text" />
      </div>

      <div class="form-group">
        <label>Position *</label>
        <input formControlName="position" type="text" />
      </div>

      <div class="form-group">
        <label>Start Date *</label>
        <input formControlName="startDate" type="date" />
      </div>

      <div class="form-group">
        <label>
          <input formControlName="currentJob" type="checkbox" />
          Currently working here
        </label>
      </div>

      <div class="form-group" *ngIf="!experience.get('currentJob')?.value">
        <label>End Date</label>
        <input formControlName="endDate" type="date" />
        <div class="error" *ngIf="experience.hasError('dateRange')">
          End date must be after start date
        </div>
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea formControlName="description" rows="3"></textarea>
      </div>

      <button type="button" (click)="removeWorkExperience(i)"
              *ngIf="workExperience.length > 1">
        Remove
      </button>
    </div>

    <button type="button" (click)="addWorkExperience()">
      + Add Work Experience
    </button>
  </section>

  <!-- Skills (FormArray) -->
  <section formArrayName="skills">
    <h2>Skills</h2>

    <div *ngFor="let skill of skills.controls; let i = index"
         [formGroupName]="i"
         class="array-item">

      <div class="form-group">
        <label>Skill Name *</label>
        <input formControlName="name" type="text" placeholder="e.g., Angular" />
      </div>

      <div class="form-group">
        <label>Proficiency (1-5) *</label>
        <input formControlName="proficiency" type="range" min="1" max="5" />
        <span>{{ skill.get('proficiency')?.value }}</span>
      </div>

      <button type="button" (click)="removeSkill(i)">Remove</button>
    </div>

    <button type="button" (click)="addSkill()">+ Add Skill</button>
  </section>

  <!-- References (FormArray with minimum 2) -->
  <section formArrayName="references">
    <h2>References (Minimum 2)</h2>

    <div *ngFor="let reference of references.controls; let i = index"
         [formGroupName]="i"
         class="array-item">

      <h3>Reference {{ i + 1 }}</h3>

      <div class="form-group">
        <label>Name *</label>
        <input formControlName="name" type="text" />
      </div>

      <div class="form-group">
        <label>Email *</label>
        <input formControlName="email" type="email" />
      </div>

      <div class="form-group">
        <label>Phone *</label>
        <input formControlName="phone" type="tel" />
      </div>

      <div class="form-group">
        <label>Relationship *</label>
        <input formControlName="relationship" type="text" placeholder="e.g., Former Manager" />
      </div>

      <button type="button" (click)="removeReference(i)"
              *ngIf="references.length > 2">
        Remove
      </button>
    </div>

    <button type="button" (click)="addReference()">+ Add Reference</button>

    <div class="error" *ngIf="references.invalid && references.touched">
      At least 2 references are required
    </div>
  </section>

  <!-- File Upload -->
  <section>
    <h2>Documents</h2>

    <div class="form-group">
      <label>Resume (PDF only) *</label>
      <input type="file" accept=".pdf" (change)="onFileSelected($event)" />
      <div class="error" *ngIf="applicationForm.get('resume')?.hasError('fileType')">
        Only PDF files are allowed
      </div>
    </div>

    <div class="form-group">
      <label>Cover Letter</label>
      <textarea formControlName="coverLetter" rows="5"></textarea>
    </div>
  </section>

  <!-- Consent -->
  <section>
    <div class="form-group">
      <label>
        <input formControlName="consent" type="checkbox" />
        I agree to the terms and conditions *
      </label>
    </div>
  </section>

  <!-- Submit -->
  <button type="submit" [disabled]="applicationForm.invalid">
    Submit Application
  </button>

  <!-- Form Debug (dev only) -->
  <pre>{{ applicationForm.value | json }}</pre>
  <pre>Valid: {{ applicationForm.valid }}</pre>
</form>
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] All sections implemented (personal, work, skills, references)
- [ ] FormArray add/remove works for work experience, skills, references
- [ ] Custom validators work (age 18+, phone format, file type)
- [ ] Async validator checks email existence
- [ ] Cross-field validation (date range for work experience)
- [ ] Conditional fields (hide end date if current job)
- [ ] File upload validation (PDF only)
- [ ] Form state saves to localStorage
- [ ] Form state restores on page reload
- [ ] Minimum 2 references enforced
- [ ] Form validation shows errors after touch
- [ ] Submit button disabled when invalid

### Should Have
- [ ] Responsive design
- [ ] Loading indicator during async validation
- [ ] Clear error messages
- [ ] Accessible (labels, ARIA)
- [ ] Auto-save draft every second
- [ ] Confirmation before leaving with unsaved changes

### Nice to Have
- [ ] Progress indicator (step 1/5 completed)
- [ ] Field-level error icons
- [ ] Success animation on submit
- [ ] Export form data as JSON
- [ ] Import form data from JSON

---

## 🧪 Testing Forms

```typescript
describe('JobApplicationComponent', () => {
  it('should add work experience to FormArray', () => {
    const initialLength = component.workExperience.length;
    component.addWorkExperience();
    expect(component.workExperience.length).toBe(initialLength + 1);
  });

  it('should validate minimum 2 references', () => {
    const referencesArray = component.references;
    referencesArray.clear();
    expect(referencesArray.valid).toBe(false);

    referencesArray.push(component.createReferenceGroup());
    expect(referencesArray.valid).toBe(false);

    referencesArray.push(component.createReferenceGroup());
    expect(referencesArray.valid).toBe(true);
  });

  it('should validate age 18+', () => {
    const dobControl = component.applicationForm.get('personalInfo.dateOfBirth');

    // 17 years old
    const date17 = new Date();
    date17.setFullYear(date17.getFullYear() - 17);
    dobControl?.setValue(date17.toISOString().split('T')[0]);
    expect(dobControl?.hasError('minimumAge')).toBe(true);

    // 18 years old
    const date18 = new Date();
    date18.setFullYear(date18.getFullYear() - 18);
    dobControl?.setValue(date18.toISOString().split('T')[0]);
    expect(dobControl?.hasError('minimumAge')).toBe(false);
  });
});
```

---

## 💡 Pro Tips

1. **Use FormBuilder** - cleaner than new FormControl()
2. **Use patchValue** - for partial updates (setValue requires all fields)
3. **Abstract repeated FormGroups** - DRY principle
4. **Debounce auto-save** - don't spam localStorage
5. **MarkAsTouched recursively** - show all errors on submit
6. **Disable submit while invalid** - better UX
7. **Use getRawValue()** - includes disabled fields
8. **Clear localStorage on submit** - cleanup

---

## 📚 Resources

**Forms Guide:**
- [Angular Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [Form Validation](https://angular.dev/guide/forms/form-validation)
- [FormArray](https://angular.dev/api/forms/FormArray)

**Validators:**
- [Built-in Validators](https://angular.dev/api/forms/Validators)
- [Custom Validators](https://angular.dev/guide/forms/form-validation#defining-custom-validators)

---

**This covers every advanced form pattern you'll need in real apps!**
