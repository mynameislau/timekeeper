import {
  ApplicationRef,
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import * as dayjs from 'dayjs';
import { Observable, of, timer } from 'rxjs';
import { combineLatest, map, switchMap, first, tap } from 'rxjs/operators';
import { Interval, Intervals } from 'src/app/model/timer/timer.model';
import { roundToPrecision } from 'src/app/utils/utils';
import { observeProperty } from '../../utils/observe-property';

/**
 * Graphique qui représente une journée de travail
 */
@Component({
  selector: 'doughnut',
  templateUrl: './doughnut.component.html',
  styleUrls: ['./doughnut.component.scss'],
})
export class DoughnutComponent implements OnInit {
  @Input()
  intervals: Intervals = [];

  @Input()
  partialBg: boolean = true;

  partialBg$: Observable<boolean> = observeProperty(this, 'partialBg');

  // workaround pour bug service worker + intervals github.com/angular/angular/issues/20970
  // cf: https://angular.io/api/core/ApplicationRef
  // issue https://github.com/angular/angular-cli/issues/8779#issuecomment-350737663
  currentDate$: Observable<dayjs.Dayjs> = this.applicationRef.isStable.pipe(
    first((stable) => stable),
    switchMap(() => timer(0, 1000)),
    map(() => dayjs()),
    tap(() => {
      this.cd.detectChanges();
    })
  );

  constructor(
    private applicationRef: ApplicationRef,
    private cd: ChangeDetectorRef
  ) {}

  dashArray(interval: Interval) {
    return `${roundToPrecision(interval.end - interval.start, 2)} ${
      100 - roundToPrecision(interval.end - interval.start, 2)
    }`;
  }

  dashOffset(interval: Interval) {
    return `${roundToPrecision(-interval.start, 2) + 25}`;
  }

  bgDasharray$: Observable<string> = this.currentDate$.pipe(
    combineLatest(this.partialBg$),
    map(([date, partialBg]) => {
      if (!partialBg) {
        return '125';
      }
      const prct = (date.diff(date.startOf('day')) / 1000 / 3600 / 24) * 100;
      return `${Math.floor(prct)} ${Math.ceil(100 - prct)}`;
    })
  );

  stroke(interval: Interval) {
    switch (interval.status) {
      case 'running':
        return '#f19b9a';
      case 'done':
        return '#ffd740';
      case 'empty':
        return '#848484';
    }
  }

  ngOnInit(): void {}
}
