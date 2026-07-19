import {Component, inject, signal} from '@angular/core';
import {HttpClient,} from '@angular/common/http';

import {toSignal} from '@angular/core/rxjs-interop';
import {catchError, concatMap, EMPTY, Observable, scan, Subject} from 'rxjs';
import {withLoading} from '../shared/operators/rxjs-operators';

import {InfiniteScroll} from '../shared/directives/infinite-scroll';
import {AppLazyLoad} from '../shared/directives/app-lazy-load';
import {ArrowNavigation} from 'ui-theme';

interface PicsumImage {
  id: number;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

@Component({
  selector: 'app-lazy-load',
  imports: [
    InfiniteScroll,
    AppLazyLoad,
    ArrowNavigation
  ],
  templateUrl: './lazy-load.html',
  styleUrl: './lazy-load.scss',
})
export default class LazyLoad {

  private readonly imageSize = 450;
  private readonly limit = 15;
  private page = 1;

  private readonly http = inject(HttpClient);

  protected readonly isLoading = signal(false);
  protected readonly loadedIds = signal(new Set<number>());
  protected readonly errorIds = signal(new Set<number>());

  private readonly scrollEnd$ = new Subject<void>();
  private readonly handleScroll$ = this.scrollEnd$.pipe(
    concatMap(() => {
        const url = this.getUrl(this.page++);
        return this.handleImageFetch(url);
      }
    ),
    scan((acc: PicsumImage[], curr: PicsumImage[]) => [...acc, ...curr], [])
  );

  protected readonly pictures = toSignal(this.handleScroll$, {
    initialValue: []
  })

  protected onScrollEnd() {
    this.scrollEnd$.next();
  }

  private getUrl(pageNumber: number = 1, limit: number = this.limit): string {
    return `https://picsum.photos/v2/list?page=${pageNumber}&limit=${limit}`;
  }

  protected buildImageUrl(
    id: number,
    width: number = this.imageSize,
    height: number = this.imageSize
  ): string {
    return `https://picsum.photos/id/${id}/${width}/${height}`
  }


  private handleImageFetch(url: string): Observable<PicsumImage[]> {
    return this.http.get<PicsumImage[]>(url).pipe(
      withLoading(this.isLoading),
      catchError(() => EMPTY)
    );
  }

  protected onImageLoad(id: number): void {
    this.loadedIds.update(set => new Set(set).add(id));
  }

  protected onImageError(id: number): void {
    this.errorIds.update(set => new Set(set).add(id));
  }
}
