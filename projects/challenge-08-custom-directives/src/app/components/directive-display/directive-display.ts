import {Component} from '@angular/core';

import {HighlightDemo} from '../highlight-demo/highlight-demo';
import {DebounceClickDemo} from '../debounce-click-demo/debounce-click-demo';
import {InfiniteScrollDemo} from '../infinte-scroll-demo/infinite-scroll-demo.component';


@Component({
  selector: 'app-directive-display',
  imports: [HighlightDemo, DebounceClickDemo, InfiniteScrollDemo,
  ],
  templateUrl: './directive-display.html',
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {

}
