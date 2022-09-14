import { Observable } from "./Observable"
import { EmptyError } from "./util/EmptyError"

export interface LastValueFromConfig<T> {
  defaultValue: T
}

export function lastValueFrom<T, D>(
  source: Observable<T>,
  config: LastValueFromConfig<D>
): Promise<T | D>
export function lastValueFrom<T>(source: Observable<T>): Promise<T>
export function lastValueFrom<T, D>(
  source: Observable<T>,
  config?: LastValueFromConfig<D>
): Promise<T | D> {
  const hasConfig = typeof config === "object"
  return new Promise<T | D>((resolve, reject) => {
    let _hasValue = false
    let _value: T
    source.subscribe({
      next: value => {
        _value = value
        _hasValue = true
      },
      error: reject,
      complete: () => {
        if (_hasValue) {
          resolve(_value)
        } else if (hasConfig) {
          resolve(config!.defaultValue)
        } else {
          reject(new EmptyError())
        }
      },
    })
  })
}
