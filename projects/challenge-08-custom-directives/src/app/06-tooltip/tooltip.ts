import {Component} from '@angular/core';
import {AppTooltip} from './app-tooltip';
import {DemoShell} from '../shared/components/demo-shell/demo-shell';

@Component({
  selector: 'app-tooltip',
  imports: [AppTooltip, DemoShell],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
})
export default class Tooltip {}
