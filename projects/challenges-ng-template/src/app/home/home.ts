import {Component, signal} from '@angular/core';
import {ChallengeCard} from '../shared/components/challenge-card/challenge-card';
import {ChallengeDescriptor} from '../shared/models/challenge.model';

@Component({
  selector: 'app-home',
  imports: [ChallengeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  protected readonly title = 'Template Composition';
  protected readonly subtitle = 'Reusable, type-safe Angular component architecture without coupling layout to business logic.';

  protected readonly challenges = signal<ChallengeDescriptor[]>([
    {
      id: '01',
      title: 'Composable Panel',
      focus: 'Content projection with named slots, fallback content, and contentChild queries.',
      concepts: ['ng-content', 'Named slots', 'contentChild()'],
      route: '/composable-panel',
      state: 'Done'
    },
    {
      id: '02',
      title: 'Configurable Modal',
      focus: 'Reusable modal shell that accepts TemplateRef inputs — no hardcoded content.',
      concepts: ['TemplateRef', 'ngTemplateOutlet', 'model()'],
      route: '/configurable-modal',
      state: 'Done'
    },
    {
      id: '03',
      title: 'Dynamic Data Table',
      focus: 'Generic table component with full type inference via ngTemplateOutletContext.',
      concepts: ['Generic <T>', 'ngTemplateOutletContext', 'ngTemplateContextGuard', 'TypedRow directive'],
      route: '/dynamic-data-table',
      state: 'Done'
    },
    {
      id: '04',
      title: 'Dynamic Layout',
      focus: 'Layout shell driven by computed template selection — decoupled from content.',
      concepts: ['viewChild()', 'computed()', 'TemplateRef as signal'],
      route: '/dynamic-layout-composition',
      state: 'Done'
    },
    {
      id: '05',
      title: 'Recursive Folder Explorer',
      focus: 'Self-referencing ng-template that renders a nested tree without recursive components.',
      concepts: ['Self-referencing ngTemplateOutlet', 'Recursive context', 'depth threading'],
      route: '/recursive-folder-explorer',
      state: 'Done'
    },
    {
      id: '06',
      title: 'Template Injector Scope',
      focus: 'Override the injector used when rendering a template to access scoped services.',
      concepts: ['ngTemplateOutletInjector', 'Creation vs outlet injector'],
      route: '/template-injector',
      state: 'WIP'
    },
    {
      id: '07',
      title: 'Route-Driven Layout',
      focus: 'Router as input source — withComponentInputBinding, resolvers, guards, named outlets.',
      concepts: ['withComponentInputBinding', 'ResolveFn', 'CanActivateFn', 'Named outlets'],
      route: '/route-layout',
      state: 'WIP'
    }
  ]);
}
