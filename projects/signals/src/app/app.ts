import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Ticker} from './ticker/ticker';
import {EqualExample} from './equal-example/equal-example';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Ticker, EqualExample],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('signals');
}
