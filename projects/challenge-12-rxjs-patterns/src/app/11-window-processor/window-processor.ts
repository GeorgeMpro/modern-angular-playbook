import {Component} from '@angular/core';

@Component({
  selector: 'app-window-processor',
  imports: [],
  templateUrl: './window-processor.html',
  styleUrl: './window-processor.scss',
  standalone: true
})
export class WindowProcessor {

}

/*

## Challenge 11: The Window Processor

**Operators:** `windowTime`, `mergeMap`, `reduce`
**Data source:** Mock only — `MockApiService.getEventStream()`

### The Problem

`bufferTime` from Challenge 6 collects events into arrays. But what if you need to perform **async work on each event within a window** as it arrives — not after the window closes? You need a window that is itself an Observable, not a snapshot array.

### Task

Take the high-frequency event stream. Use `windowTime` to create 1-second windows. For each window, count only the `error` events inside it and emit that count. Display a live rolling series of "errors per second."

### Behavior

- Each 1-second window is processed as its own stream
- Only `error` type events are counted per window
- The count for each window emits when the window closes
- A rolling history of the last N window counts is displayed
- Empty windows (zero errors) still emit a count of 0

### What you'll learn

`bufferTime` → gives you `T[]` after the window closes. You can only process the snapshot.
`windowTime` → gives you `Observable<T>` for each window, open while the window is live. You can `filter`, `map`, `reduce`, or pipe any operator through it while it streams.

Use `windowTime` when the work inside the window is async or requires operators. Use `bufferTime` when you only need the collected array.

### Hint

`windowTime` emits an `Observable<T>` per window via the outer stream. To process each window, pipe through `mergeMap` and apply your inner pipeline there. The inner observable completes when the window closes — that is when you can use `reduce` or `toArray` to get a final value per window.

---*/
