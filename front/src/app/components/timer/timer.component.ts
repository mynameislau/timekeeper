import {
  ApplicationRef,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { select, Store } from '@ngrx/store';
import * as dayjs from 'dayjs';
import { Observable, timer } from 'rxjs';
import { combineLatest, first, map, switchMap, tap } from 'rxjs/operators';
import { MainState } from 'src/app/model/main/main.model';
import {
  setTimerDate,
  startTimer,
  stopTimer,
  syncRequest,
} from 'src/app/model/timer/timer.actions';
import {
  currentTimeEntriesSelector,
  DATETIME_FORMAT,
  DATE_FORMAT,
  getIntervals,
  getTotalTime,
  Intervals,
  runningTimerSelector,
  TimeEntry,
  timerDateSelector,
} from 'src/app/model/timer/timer.model';

@Component({
  selector: 'timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit {
  date$: Observable<string>;
  list$: Observable<TimeEntry[]>;
  intervals$: Observable<Intervals>;
  isCurrentDate$: Observable<boolean>;
  runningTimer$: Observable<TimeEntry | undefined>;
  totalTime$: Observable<string>;
  today$: Observable<Date>;

  constructor(
    private store: Store<MainState>,
    private applicationRef: ApplicationRef,
    private cd: ChangeDetectorRef
  ) {
    this.date$ = this.store.pipe(select(timerDateSelector));
    this.list$ = this.store.pipe(select(currentTimeEntriesSelector));

    // workaround pour bug service worker + intervals github.com/angular/angular/issues/20970
    // cf: https://angular.io/api/core/ApplicationRef
    // issue https://github.com/angular/angular-cli/issues/8779#issuecomment-350737663
    this.intervals$ = this.applicationRef.isStable.pipe(
      first((stable) => stable),
      switchMap(() => timer(0, 1000)),
      combineLatest(this.list$),
      map(([_, entries]) => {
        // console.log('click');
        return getIntervals(entries);
      }),
      tap(() => {
        this.cd.detectChanges();
      })
    );

    this.runningTimer$ = this.store.pipe(select(runningTimerSelector));
    this.isCurrentDate$ = this.date$.pipe(
      map((date) => date === dayjs().format(DATE_FORMAT))
    );
    this.totalTime$ = this.intervals$.pipe(map(getTotalTime));
    this.today$ = this.intervals$.pipe(map(() => new Date()));
  }

  prevDate() {
    this.store.dispatch(
      setTimerDate({
        date: 'PREV',
      })
    );
  }

  nextDate() {
    this.store.dispatch(
      setTimerDate({
        date: 'NEXT',
      })
    );
  }

  setDate(value: string) {
    this.store.dispatch(
      setTimerDate({
        date: dayjs(value).format(DATE_FORMAT),
      })
    );
  }

  onStopClick() {
    this.store.dispatch(
      stopTimer({
        date: dayjs().format(DATETIME_FORMAT),
      })
    );
  }

  onStartClick() {
    this.store.dispatch(
      startTimer({
        date: dayjs().format(DATETIME_FORMAT),
      })
    );
  }

  ngOnInit() {}
}
