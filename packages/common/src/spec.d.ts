export class Any {
  static readonly _: unique symbol
}

type TestExact<L, R> = (<U>() => U extends L ? 1 : 0) extends <U>() => U extends R ? 1 : 0 ? Any : never

type IsAny<T> = Any extends T ? ([T] extends [Any] ? 1 : 0) : 0

export type Test<L, R> = IsAny<L> extends 1
  ? IsAny<R> extends 1
    ? 1
    : "❌ L is 'any' but R is not"
  : IsAny<R> extends 1
  ? "❌ R is 'any' but L is not"
  : [L] extends [R]
  ? [R] extends [L]
    ? Any extends TestExact<L, R>
      ? 1
      : "❌ Unexpected or missing 'readonly' property"
    : "❌ R is not assignable to L"
  : "❌ L type is not assignable to R"

type Assert<T, U> = U extends 1 ? T : IsAny<T> extends 1 ? never : U

export const assert: <L, R>(l: Assert<L, Test<L, R>>, r: Assert<R, Test<L, R>>) => R

export const _: any

export const test: {
  (f: () => void): void
  (name?: string, f?: () => void): void
}

export const it: typeof test

export const describe: typeof test
