import {Component, signal} from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AnimateOnScroll} from '../shared/directives/animate-on-scroll';

@Component({
  selector: 'app-animate-on-scroll',
  imports: [
    DemoShell,
    AnimateOnScroll
  ],
  templateUrl: './animate-on-scroll.html',
  styleUrl: './animate-on-scroll.scss',
})
export default class AnimateOnScrollDemo {
  protected readonly repeat = signal(false);
}
