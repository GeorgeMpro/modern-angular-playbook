import {Injectable} from '@angular/core';

import {Observable, of, throwError, timer} from 'rxjs';

import {delay, map, mergeMap} from 'rxjs/operators';

export interface Item {
  id: number;
  name: string;
  category: 'log' | 'warning' | 'error';
}

export interface PageResult {
  data: Item[];
  nextPage: number | null;
}

export interface AppEvent {
  type: 'log' | 'warning' | 'error';
  message: string;
  timestamp: number;
}


export interface SaveResult {
  id: number;
  success: boolean;
}

@Injectable({providedIn: 'root'})
export class MockApiService {
  /**
   * Challenge 1 & 4 Source
   * Returns a static list of IDs to be processed.
   */
  getItemIds(): Observable<number[]> {
    return of([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).pipe(
      delay(100)
    );
  }

  /**
   * Challenge 1 & 4 Target
   * Fetches details with random 200-600ms latency and 30% failure rate.
   */
  getItemDetail(id: number): Observable<Item> {
    const randomDelay = Math.floor(Math.random() * 400) + 200;
    const shouldFail = Math.random() > 0.7;

    return of({
      id,
      name: `Item ${id}`,
      category: id % 3 === 0 ? 'error' : id % 2 === 0 ? 'warning' : 'log'
    } as Item).pipe(
      delay(randomDelay),
      mergeMap(item => shouldFail
        ? throwError(() => new Error(`Network Error: Failed to fetch item ${id}`))
        : of(item)
      )
    );
  }

  /**
   * Challenge 2: Recursive Crawler
   * Paginated results (4 pages total).
   */
  getPage(page: number): Observable<PageResult> {
    const pageSize = 5;
    const totalPages = 4;

    const data: Item[] = Array.from({length: pageSize}, (_, i) => ({
      id: (page - 1) * pageSize + i + 1,
      name: `Page ${page} - Item ${i + 1}`,
      category: 'log'
    }));

    return of({
      data,
      nextPage: page < totalPages ? page + 1 : null
    }).pipe(delay(500));
  }

  /**
   * Challenge 3, 5, 6, 7: Event Stream
   * Simulates a high-frequency WebSocket emitting every 50ms.
   */
  getEventStream(): Observable<AppEvent> {
    return timer(0, 50).pipe(
      map(i => {
        const types: AppEvent['type'][] = ['log', 'warning', 'error'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
          type,
          message: `Real-time Event ${i}`,
          timestamp: Date.now()
        };
      })
    );
  }

  /**
   * Challenge 4: Async State
   * Save operation with 40% failure rate.
   */
  saveItem(item: Item): Observable<SaveResult> {
    return this.save(item.id, item.name);
  }

  saveUser(username: string, id: number = 0): Observable<SaveResult> {
    return this.save(id, username);
  }

  private save(id: number, name: string) {
    const successRate = 0.6;
    const due = 300;
    const shouldFail = Math.random() > successRate;

    return of({id: id, success: !shouldFail}).pipe(
      delay(due),
      mergeMap(res => shouldFail
        ? throwError(() => new Error(`Persistence Error: Could not save ${name}`))
        : of(res)
      )
    );
  }
}
