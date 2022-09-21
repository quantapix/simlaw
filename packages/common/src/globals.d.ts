declare const __DEV__: boolean

declare global {
  interface SymbolConstructor {
    readonly observable: symbol
  }
}
