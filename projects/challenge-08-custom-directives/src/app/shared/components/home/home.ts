import { Component, signal } from '@angular/core';
import { ChallengeCard } from '../challenge-card/challenge-card';
import { ChallengeDescriptor } from '../../models/challenge.model';
import { ROUTE_PATHS } from '../../../app.routes';

@Component({
  selector: 'app-home',
  imports: [ChallengeCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class Home {
  protected readonly title = 'Custom Directives';

  protected readonly challenges = signal<ChallengeDescriptor[]>([
    {
      id: '01',
      title: 'Lazy Load',
      focus: 'Load images only when they enter the viewport — no wasted bandwidth on off-screen content.',
      concepts: ['IntersectionObserver', 'Renderer2', 'disconnect()'],
      route: '/' + ROUTE_PATHS.lazyLoad,
      state: 'Done'
    },
    {
      id: '02',
      title: 'Debounce Click',
      focus: 'Prevent duplicate submissions by debouncing click events into a single output.',
      concepts: ['outputFromObservable', 'Subject', 'debounce'],
      route: '/' + ROUTE_PATHS.debounceClick,
      state: 'Done'
    },
    {
      id: '03',
      title: 'Infinite Scroll',
      focus: 'Emit a scrollEnd output when the user scrolls past a configurable threshold.',
      concepts: ['throttleTime', 'afterNextRender', 'scroll threshold'],
      route: '/' + ROUTE_PATHS.infiniteScroll,
      state: 'Done'
    },
    {
      id: '04',
      title: 'Click Outside',
      focus: 'Emit when the user clicks anywhere outside the host element — for dropdowns and popovers.',
      concepts: ['document:click', 'ElementRef', 'el.contains()'],
      route: '/' + ROUTE_PATHS.clickOutside,
      state: 'Done'
    },
    {
      id: '05',
      title: 'Copy To Clipboard',
      focus: 'Turn any element into a click-to-copy button. Emits success or failure — no internal UI.',
      concepts: ['Clipboard API', 'navigator.clipboard', 'output()'],
      route: '/' + ROUTE_PATHS.copyToClipboard,
      state: 'Done'
    },
    {
      id: '06',
      title: 'Tooltip',
      focus: 'Imperatively create and position a tooltip element on hover using Renderer2.',
      concepts: ['Renderer2.createElement', 'getBoundingClientRect', 'aria-describedby'],
      route: '/' + ROUTE_PATHS.toolTip,
      state: 'Done'
    },
    {
      id: '07',
      title: 'Auto Focus',
      focus: 'Focus the host element after the first render — no ngAfterViewInit setTimeout hack.',
      concepts: ['afterNextRender', 'ElementRef', 'focus()'],
      route: '/auto-focus',
      state: 'WIP'
    },
    {
      id: '08',
      title: 'Highlight',
      focus: 'Apply a background highlight colour to the host element, reacting to signal input changes.',
      concepts: ['effect()', 'host style bindings', 'defaultColor'],
      route: '/' + ROUTE_PATHS.highlight,
      state: 'Done'
    },
    {
      id: '09',
      title: 'Permission',
      focus: 'Structural directive that shows or hides content based on the current user\'s role.',
      concepts: ['ViewContainerRef', 'TemplateRef', 'createEmbeddedView'],
      route: '/permission',
      state: 'WIP'
    },
    {
      id: '10',
      title: 'Trap Focus',
      focus: 'Cycle Tab and Shift+Tab within a container — required for accessible modal dialogs.',
      concepts: ['querySelectorAll', 'KeyboardEvent', 'WCAG 2.4.3'],
      route: '/trap-focus',
      state: 'WIP'
    },
    {
      id: '11',
      title: 'Long Press',
      focus: 'Emit after the user holds for a configurable threshold. Cancel if released early.',
      concepts: ['switchMap', 'timer', 'takeUntil', 'fromEvent'],
      route: '/long-press',
      state: 'WIP'
    },
    {
      id: '12',
      title: 'Animate On Scroll',
      focus: 'Add a CSS class when an element enters the viewport. Optionally repeat on re-entry.',
      concepts: ['IntersectionObserver', 'class toggle', 'repeat option'],
      route: '/animate-on-scroll',
      state: 'WIP'
    },
    {
      id: '13',
      title: 'Numbers Only',
      focus: 'Block non-numeric keystrokes and sanitize clipboard paste on an input element.',
      concepts: ['keydown filter', 'paste intercept', 'Renderer2.setProperty'],
      route: '/numbers-only',
      state: 'WIP'
    },
    {
      id: '14',
      title: 'Resize Observer',
      focus: 'Emit the element\'s dimensions whenever its size changes — independent of the viewport.',
      concepts: ['ResizeObserver', 'DestroyRef.onDestroy', 'contentRect'],
      route: '/resize-observer',
      state: 'WIP'
    },
    {
      id: '15',
      title: 'Composition',
      focus: 'Compose DebounceClick and CopyToClipboard onto a single component via hostDirectives.',
      concepts: ['hostDirectives', 'inputs alias', 'directive-on-directive'],
      route: '/composition',
      state: 'WIP'
    },
    {
      id: '16',
      title: 'Typed If',
      focus: 'Structural directive that narrows T | null to T inside the template block.',
      concepts: ['ngTemplateGuard', 'ngTemplateContextGuard', 'type narrowing'],
      route: '/typed-if',
      state: 'WIP'
    },
    {
      id: '17',
      title: 'Async',
      focus: 'Subscribe to an Observable and expose $implicit, loading, and error as typed context.',
      concepts: ['ngTemplateContextGuard', 'toObservable', 'switchMap', 'patch context'],
      route: '/async',
      state: 'WIP'
    },
    {
      id: '18',
      title: 'Exit Confirm',
      focus: 'Show the browser\'s native Leave site? dialog on tab close or refresh when a form is dirty.',
      concepts: ['window:beforeunload', 'event.preventDefault()', 'CanDeactivate complement'],
      route: '/exit-confirm',
      state: 'WIP'
    },
  ]);
}
