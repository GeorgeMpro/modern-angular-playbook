import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
class Query {
  readonly query = signal<string>('');

}

export default Query
