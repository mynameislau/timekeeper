import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as cuid from 'cuid';
import * as dayjs from 'dayjs';
import { isNotNil } from 'src/app/utils/ts-utils';
import { roundToPrecision } from 'src/app/utils/utils';
import { MainState } from '../main/main.model';
import {
  AnyTimersAction,
  FETCH_TIME_ENTRIES_SUCCESS,
  SET_TIMER_DATE,
  START_TIMER,
  STOP_TIMER,
  SYNC_CANCEL,
  SYNC_ERROR,
  SYNC_REQUEST,
  SYNC_SUCCESS,
  FETCH_TIME_ENTRIES_REQUEST,
  FETCH_TIME_ENTRIES_ERROR,
} from './timer.actions';

export const UNSYNCHRONIZED = 'UNSYNCHRONIZED';
export const START_SYNCHRONIZED = 'START_SYNCHRONIZED';
export const SYNCHRONIZED = 'SYNCHRONIZED';

/**
 * modele d'une entree de timer dans le store redux
 */
export type TimeEntry = Readonly<{
  id: string;
  // ownerId?: number;
  startsAt: string;
  endsAt: string | null;
  duration?: string;
  synchronizationState:
    | typeof UNSYNCHRONIZED
    | typeof START_SYNCHRONIZED
    | typeof SYNCHRONIZED;
}>;

export const DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
export const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * state générale du timer
 */
export type TimerState = EntityState<TimeEntry> & {
  date: string;
  syncing: boolean;
  fetching: boolean;
  fetchError: string | null;
  syncError: string | null;
};

const adapter = createEntityAdapter<TimeEntry>();

/**
 * au démarrage on récupere les infos du local storage pour gérer
 * le offline
 */
const fromLocalStorage = JSON.parse(
  localStorage.getItem('timers') ?? '[]'
) as TimeEntry[];
const initialState = adapter.addMany(
  fromLocalStorage,
  adapter.getInitialState({
    date: dayjs().format(DATE_FORMAT),
    syncing: false,
    fetching: false,
    fetchError: null,
    syncError: null,
  })
);

/**
 * FUNCTIONS
 */

export const getEntitiesArray = ({ entities }: TimerState) =>
  Object.values(entities).filter(isNotNil);

/**
 * les "intervalles" sont les débuts et fin de chaque entrée,
 * plus les périodes "vides", exprimés en pourcents. Ils servent
 * essentiellement a construire le graphique
 */
export const getIntervals = (entries: TimeEntry[]) => {
  if (entries.length === 0) {
    return [];
  }

  const dayjsIntervals = entries.reduce<
    {
      start: dayjs.Dayjs;
      end: dayjs.Dayjs;
      status: 'empty' | 'done' | 'running';
    }[]
  >((acc, val) => {
    const start = dayjs(val.startsAt);
    const isCurrentTimer = val.endsAt === null;
    const end = val.endsAt === null ? dayjs() : dayjs(val.endsAt);
    const prev = acc.length ? acc[acc.length - 1].end : start.startOf('day');
    const diff = start.diff(prev);
    return diff > 0
      ? [
          ...acc,
          { start: prev, end: start, status: 'empty' },
          { start, end, status: isCurrentTimer ? 'running' : 'done' },
        ]
      : [...acc, { start, end, status: isCurrentTimer ? 'running' : 'done' }];
  }, []);

  return dayjsIntervals.map(({ start, end, status }) => ({
    status,
    start: (start.diff(start.startOf('day')) / 1000 / 3600 / 24) * 100,
    end: (end.diff(end.startOf('day')) / 1000 / 3600 / 24) * 100,
  }));
};

export type Intervals = ReturnType<typeof getIntervals>;
export type Interval = Intervals[number];

/**
 * temps toal de travail sur une journee
 */
export const getTotalTime = (entries: Intervals) => {
  const fractionOfDay =
    entries
      .filter(({ status }) => status !== 'empty')
      .reduce((acc, { start, end }) => {
        return acc + end - start;
      }, 0) / 100 * 24;

  return dayjs().startOf('day').add(fractionOfDay, 'hour').format('HH:mm:ss');
};

export const getRunningTimer = (state: TimerState) =>
  getEntitiesArray(state).find(({ endsAt }) => endsAt === null);

/**
 * si l'utilisateur a oublié par mégarde d'éteindre un timer avant minuit
 * on normalise le state
 * @param state
 */
export const normalizeState = (state: TimerState) => {
  const running = getRunningTimer(state);

  // timers oubliés
  if (
    running &&
    dayjs(running.startsAt).format(DATE_FORMAT) !== dayjs().format(DATE_FORMAT)
  ) {
    return adapter.updateOne(
      {
        id: running.id,
        changes: {
          endsAt: `${dayjs(running.startsAt).format(DATE_FORMAT)}T23:59:59`,
        },
      },
      state
    );
  }

  return state;
};

/**
 * permet de récuperer les timer non synchronisés avec
 * le serveur
 */
export const getTemporaries = (entities: TimeEntry[]) =>
  entities
    .filter(({ synchronizationState }) => synchronizationState !== SYNCHRONIZED)
    .sort((a, b) => {
      if (a.startsAt < b.startsAt) return -1;
      if (a.startsAt > b.startsAt) return 1;
      return 0;
    });

/**
 * SELECTORS
 */

export const timersStateSelector = createFeatureSelector<MainState, TimerState>(
  'timer'
);

export const timerDateSelector = createSelector(
  timersStateSelector,
  ({ date }) => date
);

export const timerEntitiesSelector = createSelector(
  timersStateSelector,
  getEntitiesArray
);

export const currentTimeEntriesSelector = createSelector(
  timersStateSelector,
  timerDateSelector,
  (state: TimerState, day: string) =>
    getEntitiesArray(state).filter((entry) => entry.startsAt.startsWith(day))
);

export const runningTimerSelector = createSelector(
  timersStateSelector,
  getRunningTimer
);

export const inSyncSelector = createSelector(timerEntitiesSelector, (entries) =>
  entries.find((entry) => entry.synchronizationState !== SYNCHRONIZED)
    ? false
    : true
);

export const syncingSelector = createSelector(
  timersStateSelector,
  ({ syncing }) => syncing
);

export const fetchingSelector = createSelector(
  timersStateSelector,
  ({ fetching }) => fetching
);

export const fetchErrorSelector = createSelector(
  timersStateSelector,
  ({ fetchError }) => fetchError
);

export const syncErrorSelector = createSelector(
  timersStateSelector,
  ({ syncError }) => syncError
);

/**
 * REDUCER
 */

export const timerReducer = (
  state: TimerState = initialState,
  action: AnyTimersAction
): TimerState => {
  state = normalizeState(state);

  switch (action.type) {
    // changement de la date courante du timer
    case SET_TIMER_DATE:
      return {
        ...state,
        date:
          action.date === 'PREV'
            ? dayjs(state.date).subtract(1, 'day').format(DATE_FORMAT)
            : action.date === 'NEXT'
            ? dayjs(state.date).add(1, 'day').format(DATE_FORMAT)
            : action.date,
      };

    case FETCH_TIME_ENTRIES_REQUEST:
      return { ...state, fetching: true, fetchError: null };

    case FETCH_TIME_ENTRIES_ERROR:
      return { ...state, fetching: false, fetchError: action.error };

    /**
     * quand on fetch les timers du serveur pour un jour donné
     * on suppprime les infos précedemment stockées (et synchronisées)
     * et on update avec les nouvelles données.
     */
    case FETCH_TIME_ENTRIES_SUCCESS:
      state = { ...state, fetching: false, fetchError: null };
      const withoutEntriesOfDay = adapter.removeMany(
        (entry) =>
          entry.synchronizationState === SYNCHRONIZED &&
          entry.startsAt.split('T')[0] === action.date,
        state
      );
      return adapter.upsertMany(
        action.timers.map((entry) => ({
          ...entry,
          synchronizationState: SYNCHRONIZED,
        })),
        withoutEntriesOfDay
      );

    /**
     * on démarre un timer,
     * il n'est pas encore synchronisé avec le serveur
     */
    case START_TIMER:
      return adapter.addOne(
        {
          id: cuid(),
          startsAt: action.date,
          endsAt: null,
          synchronizationState: UNSYNCHRONIZED,
        },
        state
      );

    /**
     * on stop le timer,
     * si son démarrage etait deja synchro avec le serveur
     * son statut passe à 'start_synchronized'
     * sinon il est juste 'unsynchronized'
     */
    case STOP_TIMER:
      const running = getRunningTimer(state);
      if (!running) {
        return state;
      }
      const endOfDay = dayjs(running.startsAt).endOf('day');
      return adapter.updateOne(
        {
          id: running.id,
          changes: {
            endsAt: endOfDay.isBefore(action.date) ? endOfDay.format(DATETIME_FORMAT) : action.date,
            synchronizationState:
              running.synchronizationState === SYNCHRONIZED
                ? START_SYNCHRONIZED
                : UNSYNCHRONIZED,
          },
        },
        state
      );

    case SYNC_REQUEST:
      return { ...state, syncing: true, syncError: null };

    case SYNC_CANCEL:
      return { ...state, syncing: false };

    /**
     * en cas d'erreur serveur on supprime le timer erroné
     */
    case SYNC_ERROR:
      state = { ...state, syncing: false, syncError: action.error };
      if (!action.isInternalServerError) {
        return state;
      }
      return adapter.removeOne(action.tempId, state);

    /**
     * en cas de succes de la synchro on update le statut de l'entree
     * qui passe soit a synchronized soit a 'start synchronized' si
     * il tourne encore
     */
    case SYNC_SUCCESS:
      state = { ...state, syncing: false, syncError: null };

      const tempEntry = state.entities[action.tempId]!;

      const newState =
        action.updateType === 'stop'
          ? SYNCHRONIZED
          : tempEntry.endsAt
          ? START_SYNCHRONIZED
          : SYNCHRONIZED;

      const updated = {
        ...tempEntry,
        synchronizationState: newState,
        id: action.serverId,
      } as const;

      const wRemoved = adapter.removeOne(action.tempId, state);

      return adapter.addOne(updated, wRemoved);
  }

  return state;
};
