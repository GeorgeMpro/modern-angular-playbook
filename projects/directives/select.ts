import {Directive, inject, input, TemplateRef, ViewContainerRef} from '@angular/core';


@Directive({
  selector: '[appSelect]',
})
export class Select {

  private templateRef = inject(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);

  readonly selectFrom = input.required<DataSource>();

  async ngOnInit() {
    const data = await this.selectFrom.load();
    this.viewContainerRef.createEmbeddedView(this.templateRef, {
      // Create the embedded view with a context object that contains
      // the data via the key `$implicit`.
      $implicit: data,
    });
  }

}
