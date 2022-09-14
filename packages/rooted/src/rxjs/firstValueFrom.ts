import { Observable } from "./Observable"
import { EmptyError } from "./util/EmptyError"
import { SafeSubscriber } from "./Subscriber"

export interface FirstValueFromConfig<T> {
  defaultValue: T
}

export function firstValueFrom<T, D>(
  source: Observable<T>,
  config: FirstValueFromConfig<D>
): Promise<T | D>
export function firstValueFrom<T>(source: Observable<T>): Promise<T>
export function firstValueFrom<T, D>(
  source: Observable<T>,
  config?: FirstValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof config === "object"
  return new Promise<T | D>((resolve, reject) => {
    const subscriber = new SafeSubscriber<T>({
      next: value => {
        resolve(value)
        subscriber.unsubscribe()
      },
      error: reject,
      complete: () => {
        if (hasConfig) {
          resolve(config!.defaultValue)
        } else {
          reject(new EmptyError())
        }
      },
    })
    source.subscribe(subscriber)
  })
}
