import { Action } from "./scheduler/Action"
import { Subscription } from "./Subscription"
import { SchedulerLike, SchedulerAction } from "./types"
import { dateTimestampProvider } from "./scheduler/dateTimestampProvider"

export class Scheduler implements SchedulerLike {
  public static now: () => number = dateTimestampProvider.now

  constructor(
    private schedulerActionCtor: typeof Action,
    now: () => number = Scheduler.now
  ) {
    this.now = now
  }

  public now: () => number

  public schedule<T>(
    work: (this: SchedulerAction<T>, state?: T) => void,
    delay: number = 0,
    state?: T
  ): Subscription {
    return new this.schedulerActionCtor<T>(this, work).schedule(state, delay)
  }
}
