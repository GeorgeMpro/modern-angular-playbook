import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {DirectiveDisplay} from './components/directive-display/directive-display';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DirectiveDisplay],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('challenge-08-custom-directives');
}
