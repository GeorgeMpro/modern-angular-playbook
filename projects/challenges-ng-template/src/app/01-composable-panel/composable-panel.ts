import {Component} from '@angular/core';

import {Panel} from './panel';

export type Theme = 'primary' | 'warning';

@Component({
  selector: 'app-composable-panel',
  imports: [
    Panel,
  ],
  templateUrl: './composable-panel.html',
  styleUrl: './composable-panel.scss',
})
export default class ComposablePanel {

}
