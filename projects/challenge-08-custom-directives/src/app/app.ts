import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {DirectiveDisplay} from './components/directive-display/directive-display';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DirectiveDisplay],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('challenge-08-custom-directives');
}
