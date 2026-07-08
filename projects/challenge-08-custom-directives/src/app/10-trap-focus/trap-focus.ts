import {Component} from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppTrapFocus} from './app-trap-focus';

@Component({
  selector: 'app-trap-focus',
  imports: [
    DemoShell,
    AppTrapFocus
  ],
  templateUrl: './trap-focus.html',
  styleUrl: './trap-focus.scss',
})
export default class TrapFocus {

}
