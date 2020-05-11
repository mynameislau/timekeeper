import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType,
  ROOT_EFFECTS_INIT,
} from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { isServerError } from 'src/app/services/api.service';
import { OfflineService } from 'src/app/services/offline.service';
import { MainState } from '../main/main.model';
import {
  AnyTimersAction,
  fetchTimeEntriesError,
  fetchTimeEntriesRequest,
  fetchTimeEntriesSuccess,
  FETCH_TIME_ENTRIES_REQUEST,
  FETCH_TIME_ENTRIES_SUCCESS,
  SET_TIMER_DATE,
  START_TIMER,
  STOP_TIMER,
  syncCancel,
  syncError,
  syncRequest,
  syncSuccess,
  SYNC_REQUEST,
  SYNC_SUCCESS,
} from './timer.actions';
import {
  getTemporaries,
  START_SYNCHRONIZED,
  timerDateSelector,
  timerEntitiesSelector,
} from './timer.model';
import { TimerService } from './timer.service';

@Injectable()
export class TimerEffects {
  constructor(
    private actions$: Actions<AnyTimersAction>,
    private store: Store<MainState>,
    private timerService: TimerService,
    private offlineService: OfflineService
  ) {}

  /**
   * dès que l'application a de nouveau une connexion
   * on tente de synchroniser
   */
  syncIfBackOnline$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      switchMap((_action) => this.offlineService.isOffline$),
      filter((isOffline) => (isOffline ? false : true)),
      switchMap(() => of(syncRequest()))
    )
  );

  /**
   * enregistrement dans le local storage
   * a chaque écriture dans le store
   */
  timersWrite$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(START_TIMER, STOP_TIMER, FETCH_TIME_ENTRIES_SUCCESS, SYNC_SUCCESS),
        concatMap((action) =>
          of(action).pipe(
            withLatestFrom(this.store.pipe(select(timerEntitiesSelector)))
          )
        ),
        tap(([_action, entities]) => {
          localStorage.setItem('timers', JSON.stringify(entities));
        })
      ),
    { dispatch: false }
  );


  /**
   * si on demarre ou arrete un timer, on tente une synchro
   */
  syncOnWrite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(START_TIMER, STOP_TIMER),
      mergeMap(() => of(syncRequest()))
    )
  );

  /**
   * la synchronisation fonctionne sous forme de boucle,
   * tant qu'il reste des timers non synchronisés,
   * on repasse dans la boucle
   */
  syncToServer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SYNC_REQUEST),
      concatMap((action) =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(timerEntitiesSelector)))
        )
      ),
      switchMap(([_action, entities]) => {
        const entry = getTemporaries(entities)[0];

        /**
         * si il n'y a plus de timer temporaire
         * on arrete la boucle
         */
        if (!entry) {
          return [syncCancel(), fetchTimeEntriesRequest({})];
        }

        /**
         * de meme si le timer courant a été synchronisé sur le serveur
         */
        if (
          entry.synchronizationState === START_SYNCHRONIZED &&
          entry.endsAt === null
        ) {
          return of(syncCancel());
        }

        const updateType =
          entry.synchronizationState === START_SYNCHRONIZED
            ? 'stop'
            : ('start' as const);

        /**
         * doit on démarrer ou arreter le serveur ?
         */
        const serverOp =
          updateType === 'stop'
            ? this.timerService.postTimerStop(entry.endsAt!)
            : this.timerService.postTimerStart(entry.startsAt);

        return serverOp.pipe(
          switchMap((responseData) => [
            syncSuccess({
              tempId: entry.id,
              serverId: responseData.id,
              updateType,
            }),
            syncRequest(),
          ]),
          catchError((error: HttpErrorResponse) =>
            of(
              syncError({
                isInternalServerError:
                  isServerError(error.error) && error.status ? true : false,
                error: isServerError(error.error)
                  ? error.error.Message
                  : String(error),
                tempId: entry.id,
              })
            )
          )
        );
      })
    )
  );

  /**
   * si on change de jour on refetch les timeentries
   */
  dateChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SET_TIMER_DATE),
      mergeMap(() => of(fetchTimeEntriesRequest({})))
    )
  );

  getTimerEntriesFromServer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FETCH_TIME_ENTRIES_REQUEST),
      concatMap((action) =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(timerDateSelector)))
        )
      ),
      switchMap(([action, date]) => {
        const dayDate = action.date ?? date;
        return this.timerService.getTimeEntriesForDate(dayDate).pipe(
          map((responseData) =>
            fetchTimeEntriesSuccess({
              timers: responseData,
              date: dayDate,
            })
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              fetchTimeEntriesError({
                error: isServerError(error.error)
                  ? error.error.Message
                  : String(error),
              })
            )
          )
        );
      })
    )
  );
}
