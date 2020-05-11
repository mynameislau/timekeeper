import { Injectable } from '@angular/core';
import { Observable, merge, of, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * observable pour savoir quand l'appli passe online ou offline
 */
@Injectable({
  providedIn: 'root',
})
export class OfflineService {
  isOffline$: Observable<boolean>;

  constructor() {
    this.isOffline$ = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).pipe(map(() => !navigator.onLine));
  }
}
