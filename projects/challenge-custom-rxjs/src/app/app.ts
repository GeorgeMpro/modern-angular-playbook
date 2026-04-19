import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {catchError, interval, map, of} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {retryWithBackoff} from '../rxjs-operators/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('challenge-custom-rxjs');

  private readonly destroyRef = inject(DestroyRef);

  private readonly source$ = interval(300).pipe(
    takeUntilDestroyed(this.destroyRef),
    map(val => {
      if (val > 5) {
        throw new Error(`Error! ${val}`)
      }
      return val;
    }),
    retryWithBackoff(3, 1000),
    catchError((err) => {
      console.log(err);
      return of(err)
    })
  );

  ngOnInit() {
    this.source$.subscribe({
      next: (val) => console.log((`hello ${val}`)),
      error: (err) => console.error(`Error!: ${err}`)
    });
  }

}
