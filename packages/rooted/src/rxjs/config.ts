import { Subscriber } from "./Subscriber"
import { ObservableNotification } from "./types"

export const config: GlobalConfig = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: undefined,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false,
}

export interface GlobalConfig {
  onUnhandledError: ((err: any) => void) | null

  onStoppedNotification:
    | ((
        notification: ObservableNotification<any>,
        subscriber: Subscriber<any>
      ) => void)
    | null

  Promise?: PromiseConstructorLike
  useDeprecatedSynchronousErrorHandling: boolean

  useDeprecatedNextContext: boolean
}
