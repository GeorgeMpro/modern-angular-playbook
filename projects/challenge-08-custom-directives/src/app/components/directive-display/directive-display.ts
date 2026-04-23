import {Component} from '@angular/core';

import {HighlightDemo} from '../highlight-demo/highlight-demo';
import {DebounceClickDemo} from '../debounce-click-demo/debounce-click-demo';


@Component({
  selector: 'app-directive-display',
  imports: [HighlightDemo, DebounceClickDemo
  ],
  templateUrl: './directive-display.html',
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {

}
