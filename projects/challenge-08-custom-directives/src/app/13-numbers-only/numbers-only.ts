import { Component } from '@angular/core';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';
import {AppNumbersOnly} from '../shared/directives/app-numbers-only.directive';

@Component({
  selector: 'app-numbers-only',
  imports: [
    DemoShell,
    AppNumbersOnly
  ],
  templateUrl: './numbers-only.html',
  styleUrl: './numbers-only.scss',
})
export default class NumbersOnly {

}
