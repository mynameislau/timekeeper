import { Injectable } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { TimeEntry, DATE_FORMAT, SYNCHRONIZED } from './timer.model';
import * as dayjs from 'dayjs';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export type ServerTimeEntry = Readonly<{
  id: string;
  startsAt: string;
  endsAt: string | null;
}>;

export type TimersServerResponse = {
  data: {
    items: ServerTimeEntry[];
  };
};

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  constructor(private apiService: ApiService) {}

  getTimeEntriesForDate(date: string) {
    const dayafter = dayjs(date).add(1, 'day').format(DATE_FORMAT);

    /**
     * on récupere les entrees sauvegardées, mais aussi le timer courant si il
     * existe. Dans l'idéal il faudrait optimiser les appels serveurs un peu plus.
     */
    return combineLatest([
      this.apiService.get<TimersServerResponse>(
        `timeentries?layer=0&ownerId=16&startsAt=between,${date},${dayafter}&fields=id,startsAt,endsAt`
      ),
      this.apiService.get<TimersServerResponse>(
        `timers?ownerId=16&endsAt=null&fields=id,startsAt,endsAt`
      ),
    ]).pipe(
      map(([a, b]) => [...a.data.items, ...b.data.items]),
      map((res) =>
        res.map(
          (entry) =>
            ({
              ...entry,
              id: String(entry.id),
            } as const)
        )
      )
    );
  }

  /**
   * suppressione et ajout de timer
   */
  startOrStop(type: 'start' | 'stop', date: string) {
    const body = {
      ownerid: 16,
      date,
    };
    return this.apiService
      .post<typeof body, { data: { id: number } }>(
        type === 'start' ? 'timers/start' : 'timers/stop',
        body
      )
      .pipe(map((res) => ({ id: String(res.data.id) })));
  }

  postTimerStart(date: string) {
    return this.startOrStop('start', date);
  }

  postTimerStop(date: string) {
    return this.startOrStop('stop', date);
  }
}
