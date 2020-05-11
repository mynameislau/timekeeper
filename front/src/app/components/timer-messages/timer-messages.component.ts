import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MainState } from 'src/app/model/main/main.model';
import { syncRequest } from 'src/app/model/timer/timer.actions';
import {
  fetchErrorSelector,
  fetchingSelector,
  inSyncSelector,
  syncErrorSelector,
  syncingSelector,
} from 'src/app/model/timer/timer.model';
import { OfflineService } from 'src/app/services/offline.service';

@Component({
  selector: 'timer-messages',
  templateUrl: './timer-messages.component.html',
  styleUrls: ['./timer-messages.component.scss'],
})
export class TimerMessagesComponent implements OnInit {
  inSync$: Observable<boolean>;
  isOffline$: Observable<boolean>;
  syncing$: Observable<boolean>;
  fetching$: Observable<boolean>;
  fetchError$: Observable<boolean>;
  syncError$: Observable<boolean>;

  constructor(
    private offlineService: OfflineService,
    private store: Store<MainState>
  ) {
    this.isOffline$ = this.offlineService.isOffline$;
    this.inSync$ = this.store.pipe(select(inSyncSelector));
    this.syncing$ = this.store.pipe(select(syncingSelector));
    this.fetching$ = this.store.pipe(select(fetchingSelector));
    this.fetchError$ = this.store.pipe(
      select(fetchErrorSelector),
      map((error) => (error === null ? false : true))
    );
    this.syncError$ = this.store.pipe(
      select(syncErrorSelector),
      map((error) => error !== null)
    );
  }

  syncRequest() {
    this.store.dispatch(syncRequest());
  }

  ngOnInit(): void {
  }
}
