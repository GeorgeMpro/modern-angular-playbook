import {Component, inject, Signal, ChangeDetectionStrategy} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import Query from '../query';

@Component({
  selector: 'app-search-results',
  imports: [],
  templateUrl: './search-results.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search-results.scss',
})
export class SearchResults {

  private readonly http = inject(HttpClient);
  query: Signal<string> = inject(Query).query;

  query$ = toObservable(this.query);

  results$ = this.query$.pipe(
    switchMap((query) => this.http.get('/search?q=' + query)));
}
