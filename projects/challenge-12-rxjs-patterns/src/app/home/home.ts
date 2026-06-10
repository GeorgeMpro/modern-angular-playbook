import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {ChallengeDescriptor} from '../shared/models/challenge.model';
import {ChallengeCardComponent} from '../shared/components/challenge-card/challenge-card';
import {TitleCasePipe} from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [ChallengeCardComponent, TitleCasePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class HomeComponent {
  protected readonly title = 'reactive design patterns';
  protected readonly challenges = signal<ChallengeDescriptor[]>([
    {
      id: '01',
      title: 'Parallel Batcher',
      problem: 'API rate-limiting when fetching bulk details for multiple IDs.',
      solution: 'mergeMap with a concurrency window of 3 and toArray for atomic updates.',
      win: 'Prevents server saturation while maximizing throughput.',
      route: '/parallel-batcher',
      tags: ['mergeMap', 'toArray', 'Concurrency']
    },
    {
      id: '02',
      title: 'Recursive Crawler',
      problem: 'Navigating paginated APIs with unknown depth or dynamic next-page links.',
      solution: 'expand for recursive discovery and takeWhile for termination logic.',
      win: 'Elegant recursion without manual subscription management.',
      route: '/recursive-crawler',
      tags: ['expand', 'takeWhile', 'Recursion']
    },
    {
      id: '03',
      title: 'Stream Multiplexer',
      problem: 'Single WebSocket-style source feeding multiple UI consumers with different needs.',
      solution: 'groupBy with a polymorphic dispatch table and bufferTime for warning batches.',
      win: 'Decoupled logic—one subscription, many behaviors.',
      route: '/stream-multiplexer',
      tags: ['groupBy', 'bufferTime', 'Multiplexing']
    },
    {
      id: '04',
      title: 'Async Accumulator',
      problem: 'Building a UI list that updates as multiple async operations resolve over time.',
      solution: 'mergeScan for async state accumulation and a merge pipeline for pending counts.',
      win: 'Race-condition free state management without external variables.',
      route: '/async-state-accumulator',
      tags: ['mergeScan', 'scan', 'State Management']
    },
    {
      id: '05',
      title: 'Stream Splitter',
      problem: 'Isolating critical errors from normal logs without double-subscribing to the source.',
      solution: 'partition to multicast a single source into independent streams.',
      win: 'Efficient resource usage on high-frequency data streams.',
      route: '/stream-splitter',
      tags: ['partition', 'Multicasting']
    },
    {
      id: '06',
      title: 'High-Pressure Smoother',
      problem: 'UI jank caused by rapid data emissions exceeding browser render cycles.',
      solution: 'bufferTime for batching and auditTime for latest-state snapshots.',
      win: 'Smooth 60fps UI regardless of incoming data velocity.',
      route: '/high-pressure-smoother',
      tags: ['bufferTime', 'auditTime', 'Backpressure']
    },
    {
      id: '07',
      title: 'Signal Bridge',
      problem: 'Bridging user-input Signals to complex async RxJS search pipelines.',
      solution: 'toObservable with switchMap and toSignal for seamless framework interop.',
      win: 'Zero manual subscriptions; fully declarative data fetching.',
      route: '/signal-bridge',
      tags: ['toObservable', 'toSignal', 'Signals Interop']
    },
    {
      id: '08',
      title: 'Form Guard',
      problem: 'Preventing duplicate submissions (button mashing) and handling flaky network retries.',
      solution: 'exhaustMap for submission guarding and defer with exponential backoff for resilience.',
      win: 'Data-layer protection that persists even if the UI isn\'t disabled.',
      route: '/form-guard',
      tags: ['exhaustMap', 'defer', 'Retry Strategy']
    },
    {
      id: '09',
      title: 'Dashboard Filter',
      problem: 'Two independent controls (category + search) that each trigger re-queries without blocking each other.',
      solution: 'combineLatest with debounced search, ViewModel pattern for atomic loading/data state, and a Map-based category cache to avoid redundant HTTP calls.',
      win: 'Flicker-free UI with cancellation, caching, and zero state synchronization bugs.',
      route: '/dashboard-filter',
      tags: ['combineLatest', 'switchMap', 'debounceTime', 'ViewModel']
    }
  ]);
}
