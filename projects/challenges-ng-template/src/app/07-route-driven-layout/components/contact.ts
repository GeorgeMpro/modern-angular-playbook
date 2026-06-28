import {Component, computed, signal} from '@angular/core';

import {form, FormField} from "@angular/forms/signals";

interface ContactData {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  imports: [
    FormField
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export default class Contact {

  protected readonly contactModel = signal<ContactData>({
    email: '', message: '', name: ''
  });

  protected readonly contactForm = form(this.contactModel);

  public readonly hasUnsavedChanges = computed(() => {
    const form = this.contactForm;
    return form.email().dirty() || form.name().dirty() || form.message().dirty();
  });

  protected onSubmit(event: SubmitEvent) {
    event.preventDefault();
    //   TODO
  }
}
