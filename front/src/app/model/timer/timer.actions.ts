import { ActionType, createAction, props } from '@ngrx/store';
import { ServerTimeEntry } from './timer.service';

export const FETCH_TIME_ENTRIES_REQUEST = 'FETCH_TIME_ENTRIES_REQUEST';
export const FETCH_TIME_ENTRIES_SUCCESS = 'FETCH_TIME_ENTRIES_SUCCESS';
export const FETCH_TIME_ENTRIES_ERROR = 'FETCH_TIME_ENTRIES_ERROR';

export const SET_TIMER_DATE = 'SET_TIMER_DATE';

export const START_TIMER = 'START_TIMER';
export const STOP_TIMER = 'STOP_TIMER';

export const SYNC_REQUEST = 'SYNC_REQUEST';
export const SYNC_ERROR = 'SYNC_ERROR';
export const SYNC_CANCEL = 'SYNC_CANCEL';
export const SYNC_SUCCESS = 'SYNC_SUCCESS';


export const fetchTimeEntriesRequest = createAction(
  FETCH_TIME_ENTRIES_REQUEST,
  props<{ date?: string }>()
);

export const fetchTimeEntriesSuccess = createAction(
  FETCH_TIME_ENTRIES_SUCCESS,
  props<{ timers: ServerTimeEntry[]; date: string }>()
);

export const fetchTimeEntriesError = createAction(
  FETCH_TIME_ENTRIES_ERROR,
  props<{ error: string }>()
);

export const setTimerDate = createAction(
  SET_TIMER_DATE,
  props<{ date: 'PREV' | 'NEXT' | string }>()
);

export const syncSuccess = createAction(
  SYNC_SUCCESS,
  props<{ tempId: string; serverId: string; updateType: 'start' | 'stop' }>()
);

export const startTimer = createAction(START_TIMER, props<{ date: string }>());
export const stopTimer = createAction(STOP_TIMER, props<{ date: string }>());
export const syncRequest = createAction(SYNC_REQUEST);
export const syncCancel = createAction(SYNC_CANCEL);
export const syncError = createAction(
  SYNC_ERROR,
  props<{ isInternalServerError: boolean; tempId: string, error: string }>()
);

export const all = {
  fetchTimeEntriesRequest,
  fetchTimeEntriesSuccess,
  fetchTimeEntriesError,
  setTimerDate,
  startTimer,
  stopTimer,
  syncSuccess,
  syncRequest,
  syncCancel,
  syncError,
} as const;

export type AnyTimersAction = ActionType<typeof all[keyof typeof all]>;
