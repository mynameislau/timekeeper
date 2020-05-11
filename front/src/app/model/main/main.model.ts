import { TimerState, timerReducer } from '../timer/timer.model';
import { AnyTimersAction } from '../timer/timer.actions';

export type MainState = {
  timer: TimerState;
};

export const mainReducersMap = {
  timer: timerReducer,
};

export type AnyAction = AnyTimersAction;
