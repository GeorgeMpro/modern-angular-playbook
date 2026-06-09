import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Enter} from './enter/enter';
import {EnterBinding} from './enter-binding/enter-binding';
import {Leave} from './leave/leave';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Enter, EnterBinding, Leave],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('animation');
}
