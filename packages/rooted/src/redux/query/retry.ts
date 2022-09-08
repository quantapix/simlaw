import { BaseQueryEnhancer, HandledError } from "./types.js"

async function defaultBackoff(attempt: number = 0, maxRetries: number = 5) {
  const attempts = Math.min(attempt, maxRetries)

  const timeout = ~~((Math.random() + 0.4) * (300 << attempts)) // Force a positive int in the case we make this an option
  await new Promise(resolve => setTimeout((res: any) => resolve(res), timeout))
}

export interface RetryOptions {
  maxRetries?: number
  backoff?: (attempt: number, maxRetries: number) => Promise<void>
}

function fail(e: any): never {
  throw Object.assign(new HandledError({ error: e }), {
    throwImmediately: true,
  })
}

const retryWithBackoff: BaseQueryEnhancer<
  unknown,
  RetryOptions,
  RetryOptions | void
> = (baseQuery, defaultOptions) => async (args, api, extraOptions) => {
  const options = {
    maxRetries: 5,
    backoff: defaultBackoff,
    ...defaultOptions,
    ...extraOptions,
  }
  let retry = 0

  while (true) {
    try {
      const result = await baseQuery(args, api, extraOptions)
      if (result.error) {
        throw new HandledError(result)
      }
      return result
    } catch (e: any) {
      retry++
      if (e.throwImmediately || retry > options.maxRetries) {
        if (e instanceof HandledError) {
          return e.value
        }
        throw e
      }
      await options.backoff(retry, options.maxRetries)
    }
  }
}

export const retry = Object.assign(retryWithBackoff, { fail })
