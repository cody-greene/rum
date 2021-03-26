/* eslint-disable */
declare const events: EventTarget & {
  connect(): void,
  disconnect(): void,
  addEventListener(type: 'reload', cb: (evt: CustomEvent<string[]>) => void): void,
  addEventListener(type: 'build-error', cb: (evt: CustomEvent<Error>) => void): void,
}

export default events
