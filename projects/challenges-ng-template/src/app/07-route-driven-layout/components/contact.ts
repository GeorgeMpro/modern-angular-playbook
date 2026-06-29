import {Component, computed, signal} from '@angular/core';
import {form, FormField} from "@angular/forms/signals";

interface ContactData {
  name: string;
  email: string;
  message: string;
}

const EMPTY: ContactData = {name: '', email: '', message: ''};

@Component({
  selector: 'app-contact',
  imports: [FormField],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export default class Contact {
  protected readonly contactModel = signal<ContactData>({...EMPTY});
  protected readonly contactForm = form(this.contactModel);
  protected readonly submitted = signal(false);

  public readonly hasUnsavedChanges = computed(() => {
    const f = this.contactForm;
    return f.email().dirty() || f.name().dirty() || f.message().dirty();
  });

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted.set(true);
  }

  protected reset(): void {
    this.submitted.set(false);
    this.contactModel.set({...EMPTY});
  }
}
