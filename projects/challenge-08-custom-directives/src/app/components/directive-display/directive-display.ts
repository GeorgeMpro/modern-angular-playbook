import {Component, ChangeDetectionStrategy} from '@angular/core';

import {HighlightDemo} from '../highlight-demo/highlight-demo';
import {DebounceClickDemo} from '../debounce-click-demo/debounce-click-demo';
import {InfiniteScrollDemo} from '../infinte-scroll-demo/infinite-scroll-demo.component';
import {CopyToClipboardDemo} from '../copy-to-clipboard-demo/copy-to-clipboard-demo';


@Component({
  selector: 'app-directive-display',
  imports: [HighlightDemo, DebounceClickDemo, InfiniteScrollDemo, CopyToClipboardDemo,
  ],
  templateUrl: './directive-display.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './directive-display.scss',
})
export class DirectiveDisplay {

}
