import { expect } from 'chai';
import * as sinon from 'sinon';
import { bindCallback } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

declare const rxTestScheduler: TestScheduler;

/** @test {bindCallback} */
describe('bindCallback', () => {
  describe('when not scheduled', () => {
    it('should emit undefined from a callback without arguments', () => {
      function callback(cb: Function) {
        cb();
      }
      const boundCallback = bindCallback(callback);
      const results: Array<string|number> = [];

      boundCallback()
        .subscribe({ next: (x: any) => {
          results.push(typeof x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal(['undefined', 'done']);
    });

    it('should support a resultSelector', () => {
      function callback(datum: number, cb: Function) {
        cb(datum);
      }

      const boundCallback = bindCallback(
        callback,
        (datum: any) => datum + 1,
      );

      const results: Array<string|number> = [];

      boundCallback(42)
        .subscribe({
          next(value) { results.push(value); },
          complete() { results.push('done'); },
        });

      expect(results).to.deep.equal([43, 'done']);
    });

    it('should support a resultSelector if its void', () => {
      function callback(datum: number, cb: Function) {
        cb(datum);
      }

      const boundCallback = bindCallback(
        callback,
        void 0,
      );

      const results: Array<string|number> = [];

      boundCallback(42)
        .subscribe({
          next(value: any) { results.push(value); },
          complete() { results.push('done'); },
        });

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should emit one value from a callback', () => {
      function callback(datum: number, cb: (result: number) => void) {
        cb(datum);
      }
      const boundCallback = bindCallback(callback);
      const results: Array<string|number> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should set callback function context to context of returned function', () => {
      function callback(this: any, cb: (arg: number) => void) {
        cb(this.datum);
      }

      const boundCallback = bindCallback(callback);
      const results: Array<string|number> = [];

      boundCallback.apply({datum: 5})
        .subscribe(
          { next: (x: number) => results.push(x), complete: () => results.push('done') }
        );

      expect(results).to.deep.equal([5, 'done']);
    });

    it('should not emit, throw or complete if immediately unsubscribed', (done) => {
      const nextSpy = sinon.spy();
      const throwSpy = sinon.spy();
      const completeSpy = sinon.spy();
      let timeout: ReturnType<typeof setTimeout>;
      function callback(datum: number, cb: Function) {
        // Need to cb async in order for the unsub to trigger
        timeout = setTimeout(() => {
          cb(datum);
        }, 0);
      }
      const subscription = bindCallback(callback)(42)
        .subscribe({ next: nextSpy, error: throwSpy, complete: completeSpy });
      subscription.unsubscribe();

      setTimeout(() => {
        expect(nextSpy).not.have.been.called;
        expect(throwSpy).not.have.been.called;
        expect(completeSpy).not.have.been.called;

        clearTimeout(timeout);
        done();
      });
    });

    it('should create a separate internal subject for each call', () => {
      function callback(datum: number, cb: (result: number) => void) {
        cb(datum);
      }
      const boundCallback = bindCallback(callback);
      const results: Array<string|number> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });
      boundCallback(54)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal([42, 'done', 54, 'done']);
    });
  });

  describe('when scheduled', () => {
    it('should emit undefined from a callback without arguments', () => {
      function callback(cb: Function) {
        cb();
      }
      const boundCallback = bindCallback(callback, rxTestScheduler);
      const results: Array<string|number> = [];

      boundCallback()
        .subscribe({ next: x => {
          results.push(typeof x);
        }, complete: () => {
          results.push('done');
        } });

      rxTestScheduler.flush();

      expect(results).to.deep.equal(['undefined', 'done']);
    });

    it('should emit one value from a callback', () => {
      function callback(datum: number, cb: (result: number) => void) {
        cb(datum);
      }
      const boundCallback = bindCallback(callback, rxTestScheduler);
      const results: Array<string|number> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      rxTestScheduler.flush();

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should set callback function context to context of returned function', () => {
      function callback(this: { datum: number }, cb: (num: number) => void) {
        cb(this.datum);
      }

      const boundCallback = bindCallback(callback, rxTestScheduler);
      const results: Array<string|number> = [];

      boundCallback.apply({ datum: 5 })
        .subscribe(
          { next: (x: number) => results.push(x), complete: () => results.push('done') }
        );

      rxTestScheduler.flush();

      expect(results).to.deep.equal([5, 'done']);
    });

    it('should error if callback throws', () => {
      const expected = new Error('haha no callback for you');
      function callback(datum: number, cb: Function): never {
        throw expected;
      }
      const boundCallback = bindCallback(callback, rxTestScheduler);

      boundCallback(42)
        .subscribe({ next: x => {
          throw new Error('should not next');
        }, error: (err: any) => {
          expect(err).to.equal(expected);
        }, complete: () => {
          throw new Error('should not complete');
        } });

      rxTestScheduler.flush();
    });

  it('should pass multiple inner arguments as an array', () => {
    function callback(datum: number, cb: (a: number, b: number, c: number, d: number) => void) {
      cb(datum, 1, 2, 3);
    }
    const boundCallback = bindCallback(callback, rxTestScheduler);
    const results: Array<string|number[]> = [];

    boundCallback(42)
      .subscribe({ next: x => {
        results.push(x);
      }, complete: () => {
        results.push('done');
      } });

    rxTestScheduler.flush();

    expect(results).to.deep.equal([[42, 1, 2, 3], 'done']);
  });

  it('should cache value for next subscription and not call callbackFunc again', () => {
    let calls = 0;
    function callback(datum: number, cb: (x: number) => void) {
      calls++;
      cb(datum);
    }
    const boundCallback = bindCallback(callback, rxTestScheduler);
    const results1: Array<number|string> = [];
    const results2: Array<number|string> = [];

    const source = boundCallback(42);

    source.subscribe({ next: x => {
      results1.push(x);
    }, complete: () => {
      results1.push('done');
    } });

    source.subscribe({ next: x => {
      results2.push(x);
    }, complete: () => {
      results2.push('done');
    } });

    rxTestScheduler.flush();

    expect(calls).to.equal(1);
    expect(results1).to.deep.equal([42, 'done']);
    expect(results2).to.deep.equal([42, 'done']);
  });

  it('should not even call the callbackFn if scheduled and immediately unsubscribed', () => {
    let calls = 0;
    function callback(datum: number, cb: Function) {
      calls++;
      cb(datum);
    }
    const boundCallback = bindCallback(callback, rxTestScheduler);
    const results1: Array<number|string> = [];

    const source = boundCallback(42);

    const subscription = source.subscribe({ next: (x: any) => {
      results1.push(x);
    }, complete: () => {
      results1.push('done');
    } });

    subscription.unsubscribe();

    rxTestScheduler.flush();

    expect(calls).to.equal(0);
  });
});

  it('should emit post-callback errors', () => {
    function badFunction(callback: (answer: number) => void): void {
      callback(42);
      throw 'kaboom';
    }
    let receivedError: any;

    bindCallback(badFunction)().subscribe({
      error: err => receivedError = err
    });

    expect(receivedError).to.equal('kaboom');
  });
});
import { expect } from 'chai';
import * as sinon from 'sinon';
import { bindNodeCallback } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

declare const rxTestScheduler: TestScheduler;

/** @test {bindNodeCallback} */
describe('bindNodeCallback', () => {
  describe('when not scheduled', () => {
    it('should emit undefined when callback is called without success arguments', () => {
      function callback(cb: Function) {
        cb(null);
      }

      const boundCallback = bindNodeCallback(callback);
      const results: Array<number | string> = [];

      boundCallback()
        .subscribe({ next: (x: any) => {
          results.push(typeof x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal(['undefined', 'done']);
    });

    it('should a resultSelector', () => {
      function callback(cb: (err: any, n: number) => any) {
        cb(null, 42);
      }

      const boundCallback = bindNodeCallback(callback, (x: number) => x + 1);
      const results: Array<number | string> = [];

      boundCallback()
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal([43, 'done']);
    });

    it('should emit one value from a callback', () => {
      function callback(datum: number, cb: (err: any, n: number) => void) {
        cb(null, datum);
      }
      const boundCallback = bindNodeCallback(callback);
      const results: Array<number | string> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should set context of callback to context of boundCallback', () => {
      function callback(this: { datum: number }, cb: (err: any, n: number) => void) {
        cb(null, this.datum);
      }
      const boundCallback = bindNodeCallback(callback);
      const results: Array<number | string> = [];

      boundCallback.call({datum: 42})
        .subscribe(
          { next: (x: number) => results.push(x), complete: () => results.push('done') }
        );

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should raise error from callback', () => {
      const error = new Error();

      function callback(cb: Function) {
        cb(error);
      }

      const boundCallback = bindNodeCallback(callback);
      const results: Array<number | string> = [];

      boundCallback()
        .subscribe({ next: () => {
          throw new Error('should not next');
        }, error: (err: any) => {
          results.push(err);
        }, complete: () => {
          throw new Error('should not complete');
        } });

      expect(results).to.deep.equal([error]);
    });

    it('should not emit, throw or complete if immediately unsubscribed', (done) => {
      const nextSpy = sinon.spy();
      const throwSpy = sinon.spy();
      const completeSpy = sinon.spy();
      let timeout: ReturnType<typeof setTimeout>;
      function callback(datum: number, cb: (err: any, n: number) => void) {
        // Need to cb async in order for the unsub to trigger
        timeout = setTimeout(() => {
          cb(null, datum);
        }, 0);
      }
      const subscription = bindNodeCallback(callback)(42)
        .subscribe({ next: nextSpy, error: throwSpy, complete: completeSpy });
      subscription.unsubscribe();

      setTimeout(() => {
        expect(nextSpy).not.have.been.called;
        expect(throwSpy).not.have.been.called;
        expect(completeSpy).not.have.been.called;

        clearTimeout(timeout);
        done();
      });
    });

    it('should create a separate internal subject for each call', () => {
      function callback(datum: number, cb: (err: any, n: number) => void) {
        cb(null, datum);
      }
      const boundCallback = bindNodeCallback(callback);
      const results: Array<number | string> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });
      boundCallback(54)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      expect(results).to.deep.equal([42, 'done', 54, 'done']);
    });
  });

  describe('when scheduled', () => {
    it('should emit undefined when callback is called without success arguments', () => {
      function callback(cb: Function) {
        cb(null);
      }

      const boundCallback = bindNodeCallback(callback, rxTestScheduler);
      const results: Array<number | string> = [];

      boundCallback()
        .subscribe({ next: (x: any) => {
          results.push(typeof x);
        }, complete: () => {
          results.push('done');
        } });

      rxTestScheduler.flush();

      expect(results).to.deep.equal(['undefined', 'done']);
    });

    it('should emit one value from a callback', () => {
      function callback(datum: number, cb: (err: any, n: number) => void) {
        cb(null, datum);
      }
      const boundCallback = bindNodeCallback(callback, rxTestScheduler);
      const results: Array<number | string> = [];

      boundCallback(42)
        .subscribe({ next: x => {
          results.push(x);
        }, complete: () => {
          results.push('done');
        } });

      rxTestScheduler.flush();

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should set context of callback to context of boundCallback', () => {
      function callback(this: { datum: number }, cb: (err: any, n: number) => void) {
        cb(null, this.datum);
      }
      const boundCallback = bindNodeCallback(callback, rxTestScheduler);
      const results: Array<number | string> = [];

      boundCallback.call({datum: 42})
        .subscribe(
          { next: (x: number) => results.push(x), complete: () => results.push('done') }
        );

      rxTestScheduler.flush();

      expect(results).to.deep.equal([42, 'done']);
    });

    it('should error if callback throws', () => {
      const expected = new Error('haha no callback for you');
      function callback(datum: number, cb: (err: any, n: number) => void) {
        throw expected;
      }
      const boundCallback = bindNodeCallback(callback, rxTestScheduler);

      boundCallback(42)
        .subscribe({ next: x => {
          throw new Error('should not next');
        }, error: (err: any) => {
          expect(err).to.equal(expected);
        }, complete: () => {
          throw new Error('should not complete');
        } });

      rxTestScheduler.flush();
    });

    it('should raise error from callback', () => {
      const error = new Error();

      function callback(cb: Function) {
        cb(error);
      }

      const boundCallback = bindNodeCallback(callback, rxTestScheduler);
      const results: Array<number | string> = [];

      boundCallback()
        .subscribe({ next: () => {
          throw new Error('should not next');
        }, error: (err: any) => {
          results.push(err);
        }, complete: () => {
          throw new Error('should not complete');
        } });

      rxTestScheduler.flush();

      expect(results).to.deep.equal([error]);
    });
  });

  it('should pass multiple inner arguments as an array', () => {
    function callback(datum: number, cb: (err: any, a: number, b: number, c: number, d: number) => void) {
      cb(null, datum, 1, 2, 3);
    }
    const boundCallback = bindNodeCallback(callback, rxTestScheduler);
    const results: Array<number[] | string> = [];

    boundCallback(42)
      .subscribe({ next: x => {
        results.push(x);
      }, complete: () => {
        results.push('done');
      } });

    rxTestScheduler.flush();

    expect(results).to.deep.equal([[42, 1, 2, 3], 'done']);
  });

  it('should cache value for next subscription and not call callbackFunc again', () => {
    let calls = 0;
    function callback(datum: number, cb: (err: any, n: number) => void) {
      calls++;
      cb(null, datum);
    }
    const boundCallback = bindNodeCallback(callback, rxTestScheduler);
    const results1: Array<number | string> = [];
    const results2: Array<number | string> = [];

    const source = boundCallback(42);

    source.subscribe({ next: x => {
      results1.push(x);
    }, complete: () => {
      results1.push('done');
    } });

    source.subscribe({ next: x => {
      results2.push(x);
    }, complete: () => {
      results2.push('done');
    } });

    rxTestScheduler.flush();

    expect(calls).to.equal(1);
    expect(results1).to.deep.equal([42, 'done']);
    expect(results2).to.deep.equal([42, 'done']);
  });

  it('should emit post callback errors', () => {
    function badFunction(callback: (error: Error, answer: number) => void): void {
      callback(null as any, 42);
      throw 'kaboom';
    }
    let receivedError: any;
    bindNodeCallback(badFunction)().subscribe({
      error: err => receivedError = err
    });

    expect(receivedError).to.equal('kaboom');
  });

  it('should not call the function if subscribed twice in a row before it resolves', () => {
    let executeCallback: any;
    let calls = 0;
    function myFunc(callback: (error: any, result: any) => void) {
      calls++;
      if (calls > 1) {
        throw new Error('too many calls to myFunc');
      }
      executeCallback = callback;
    }

    const source$ = bindNodeCallback(myFunc)();

    let result1: any;
    let result2: any;
    source$.subscribe(value => result1 = value);
    source$.subscribe(value => result2 = value);

    expect(calls).to.equal(1);
    executeCallback(null, 'test');
    expect(result1).to.equal('test');
    expect(result2).to.equal('test');
    expect(calls).to.equal(1);
  });

  it('should not even call the callbackFn if scheduled and immediately unsubscribed', () => {
    let calls = 0;
    function callback(datum: number, cb: Function) {
      calls++;
      cb(null, datum);
    }
    const boundCallback = bindNodeCallback(callback, rxTestScheduler);
    const results1: Array<number|string> = [];

    const source = boundCallback(42);

    const subscription = source.subscribe({ next: (x: any) => {
      results1.push(x);
    }, complete: () => {
      results1.push('done');
    } });

    subscription.unsubscribe();

    rxTestScheduler.flush();

    expect(calls).to.equal(0);
  });
});
import { expect } from 'chai';
import { queueScheduler as rxQueueScheduler, combineLatest, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

const queueScheduler = rxQueueScheduler;

/** @test {combineLatest} */
describe('static combineLatest', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should return EMPTY if passed an empty array as the only argument', () => {
    const results: string[] = [];
    combineLatest([]).subscribe({
      next: () => {
        throw new Error('should not emit')
      },
      complete: () => {
        results.push('done');
      }
    });

    expect(results).to.deep.equal(['done']);
  });

  it('should return EMPTY if passed an empty POJO as the only argument', () => {
    const results: string[] = [];
    combineLatest({}).subscribe({
      next: () => {
        throw new Error('should not emit')
      },
      complete: () => {
        results.push('done');
      }
    });

    expect(results).to.deep.equal(['done']);
  });
  
  it('should return EMPTY if passed an empty array and scheduler as the only argument', () => {
    const results: string[] = [];
    combineLatest([], rxTestScheduler).subscribe({
      next: () => {
        throw new Error('should not emit')
      },
      complete: () => {
        results.push('done');
      }
    });

    expect(results).to.deep.equal([]);
    rxTestScheduler.flush();
    expect(results).to.deep.equal(['done']);
  });

  it('should combineLatest the provided observables', () => {
    rxTestScheduler.run(({ hot, expectObservable }) => {
      const firstSource = hot(' ----a----b----c----|');
      const secondSource = hot('--d--e--f--g--|');
      const expected = '        ----uv--wx-y--z----|';

      const combined = combineLatest(firstSource, secondSource, (a, b) => '' + a + b);

      expectObservable(combined).toBe(expected, { u: 'ad', v: 'ae', w: 'af', x: 'bf', y: 'bg', z: 'cg' });
    });
  });

  it('should combine an immediately-scheduled source with an immediately-scheduled second', (done) => {
    const a = of(1, 2, 3, queueScheduler);
    const b = of(4, 5, 6, 7, 8, queueScheduler);
    const r = [
      [1, 4],
      [2, 4],
      [2, 5],
      [3, 5],
      [3, 6],
      [3, 7],
      [3, 8],
    ];

    const actual: [number, number][] = [];
    //type definition need to be updated
    combineLatest(a, b, queueScheduler).subscribe(
      { next: (vals) => {
        actual.push(vals);
      }, error: () => {
        done(new Error('should not be called'));
      }, complete: () => {
        expect(actual).to.deep.equal(r);
        done();
      } }
    );
  });

  it('should accept array of observables', () => {
    rxTestScheduler.run(({ hot, expectObservable }) => {
      const firstSource = hot(' ----a----b----c----|');
      const secondSource = hot('--d--e--f--g--|');
      const expected = '        ----uv--wx-y--z----|';

      const combined = combineLatest([firstSource, secondSource], (a: string, b: string) => '' + a + b);

      expectObservable(combined).toBe(expected, { u: 'ad', v: 'ae', w: 'af', x: 'bf', y: 'bg', z: 'cg' });
    });
  });

  it('should accept a dictionary of observables', () => {
    rxTestScheduler.run(({ hot, expectObservable }) => {
      const firstSource =  hot('----a----b----c----|');
      const secondSource = hot('--d--e--f--g--|');
      const expected = '        ----uv--wx-y--z----|';

      const combined = combineLatest({a: firstSource, b: secondSource}).pipe(
        map(({a, b}) => '' + a + b)
      );  

      expectObservable(combined).toBe(expected, {u: 'ad', v: 'ae', w: 'af', x: 'bf', y: 'bg', z: 'cg'});
    });
  });

  it('should work with two nevers', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' -');
      const e2subs = '  ^';
      const expected = '-';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with never and empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' |');
      const e2subs = '  (^!)';
      const expected = '-';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with empty and never', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' |');
      const e1subs = '  (^!)';
      const e2 = cold(' -');
      const e2subs = '  ^';
      const expected = '-';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with empty and empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' |');
      const e1subs = '  (^!)';
      const e2 = cold(' |');
      const e2subs = '  (^!)';
      const expected = '|';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with hot-empty and hot-single', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const values = {
        a: 1,
        b: 2,
        c: 3,
        r: 1 + 3, //a + c
      };
      const e1 = hot('-a-^-|', values);
      const e1subs = '   ^-!';
      const e2 = hot('-b-^-c-|', values);
      const e2subs = '   ^---!';
      const expected = ' ----|';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with hot-single and hot-empty', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const values = {
        a: 1,
        b: 2,
        c: 3,
      };
      const e1 = hot('-a-^-|', values);
      const e1subs = '   ^-!';
      const e2 = hot('-b-^-c-|', values);
      const e2subs = '   ^---!';
      const expected = ' ----|';

      const result = combineLatest(e2, e1, (x, y) => x + y);

      expectObservable(result).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with hot-single and never', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const values = {
        a: 1,
      };
      const e1 = hot('-a-^-|', values);
      const e1subs = '   ^-!';
      const e2 = hot('------', values); //never
      const e2subs = '   ^  ';
      const expected = ' -'; //never

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with never and hot-single', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const values = {
        a: 1,
        b: 2,
      };
      const e1 = hot('--------', values); //never
      const e1subs = '   ^----';
      const e2 = hot('-a-^-b-|', values);
      const e2subs = '   ^---!';
      const expected = ' -----'; //never

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with hot and hot', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--^--b--c--|', { a: 'a', b: 'b', c: 'c' });
      const e1subs = '     ^--------!';
      const e2 = hot('---e-^---f--g--|', { e: 'e', f: 'f', g: 'g' });
      const e2subs = '     ^---------!';
      const expected = '   ----x-yz--|';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, { x: 'bf', y: 'cf', z: 'cg' });
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with empty and error', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  ----------|'); //empty
      const e1subs = '  ^-----!';
      const e2 = hot('  ------#', undefined, 'shazbot!'); //error
      const e2subs = '  ^-----!';
      const expected = '------#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'shazbot!');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with error and empty', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--^---#', undefined, 'too bad, honk'); //error
      const e1subs = '  ^---!';
      const e2 = hot('--^--------|'); //empty
      const e2subs = '  ^---!';
      const expected = '----#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'too bad, honk');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with hot and throw', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-a-^--b--c--|', { a: 1, b: 2, c: 3 });
      const e1subs = '   ^-!';
      const e2 = hot('---^-#', undefined, 'bazinga');
      const e2subs = '   ^-!';
      const expected = ' --#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'bazinga');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with throw and hot', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^-#', undefined, 'bazinga');
      const e1subs = '   ^-!';
      const e2 = hot('-a-^--b--c--|', { a: 1, b: 2, c: 3 });
      const e2subs = '   ^-!';
      const expected = ' --#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'bazinga');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with throw and throw', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^----#', undefined, 'jenga');
      const e1subs = '   ^-!';
      const e2 = hot('---^-#', undefined, 'bazinga');
      const e2subs = '   ^-!';
      const expected = ' --#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'bazinga');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with error and throw', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-a-^--b--#', { a: 1, b: 2 }, 'wokka wokka');
      const e1subs = '   ^-!';
      const e2 = hot('---^-#', undefined, 'flurp');
      const e2subs = '   ^-!';
      const expected = ' --#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'flurp');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with throw and error', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^-#', undefined, 'flurp');
      const e1subs = '   ^-!';
      const e2 = hot('-a-^--b--#', { a: 1, b: 2 }, 'wokka wokka');
      const e2subs = '   ^-!';
      const expected = ' --#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'flurp');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with never and throw', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^-----------');
      const e1subs = '   ^-----!';
      const e2 = hot('---^-----#', undefined, 'wokka wokka');
      const e2subs = '   ^-----!';
      const expected = ' ------#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'wokka wokka');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with throw and never', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^----#', undefined, 'wokka wokka');
      const e1subs = '   ^----!';
      const e2 = hot('---^-----------');
      const e2subs = '   ^----!';
      const expected = ' -----#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'wokka wokka');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with some and throw', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^----a---b--|', { a: 1, b: 2 });
      const e1subs = '   ^--!';
      const e2 = hot('---^--#', undefined, 'wokka wokka');
      const e2subs = '   ^--!';
      const expected = ' ---#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, { a: 1, b: 2 }, 'wokka wokka');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should work with throw and some', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---^--#', undefined, 'wokka wokka');
      const e1subs = '   ^--!';
      const e2 = hot('---^----a---b--|', { a: 1, b: 2 });
      const e2subs = '   ^--!';
      const expected = ' ---#';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, { a: 1, b: 2 }, 'wokka wokka');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should handle throw after complete left', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const left = hot(' --a--^--b---|', { a: 1, b: 2 });
      const leftSubs = '      ^------!';
      const right = hot('-----^--------#', undefined, 'bad things');
      const rightSubs = '     ^--------!';
      const expected = '      ---------#';

      const result = combineLatest(left, right, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'bad things');
      expectSubscriptions(left.subscriptions).toBe(leftSubs);
      expectSubscriptions(right.subscriptions).toBe(rightSubs);
    });
  });

  it('should handle throw after complete right', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const left = hot(' -----^--------#', undefined, 'bad things');
      const leftSubs = '      ^--------!';
      const right = hot('--a--^--b---|', { a: 1, b: 2 });
      const rightSubs = '     ^------!';
      const expected = '      ---------#';

      const result = combineLatest(left, right, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'bad things');
      expectSubscriptions(left.subscriptions).toBe(leftSubs);
      expectSubscriptions(right.subscriptions).toBe(rightSubs);
    });
  });

  it('should handle interleaved with tail', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-a--^--b---c---|', { a: 'a', b: 'b', c: 'c' });
      const e1subs = '    ^----------!';
      const e2 = hot('--d-^----e---f--|', { d: 'd', e: 'e', f: 'f' });
      const e2subs = '    ^-----------!';
      const expected = '  -----x-y-z--|';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, { x: 'be', y: 'ce', z: 'cf' });
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should handle two consecutive hot observables', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--^--b--c--|', { a: 'a', b: 'b', c: 'c' });
      const e1subs = '     ^--------!';
      const e2 = hot('-----^----------d--e--f--|', { d: 'd', e: 'e', f: 'f' });
      const e2subs = '     ^-------------------!';
      const expected = '   -----------x--y--z--|';

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result).toBe(expected, { x: 'cd', y: 'ce', z: 'cf' });
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should handle two consecutive hot observables with error left', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const left = hot(' --a--^--b--c--#', { a: 'a', b: 'b', c: 'c' }, 'jenga');
      const leftSubs = '      ^--------!';
      const right = hot('-----^----------d--e--f--|', { d: 'd', e: 'e', f: 'f' });
      const rightSubs = '     ^--------!';
      const expected = '      ---------#';

      const result = combineLatest(left, right, (x, y) => x + y);

      expectObservable(result).toBe(expected, null, 'jenga');
      expectSubscriptions(left.subscriptions).toBe(leftSubs);
      expectSubscriptions(right.subscriptions).toBe(rightSubs);
    });
  });

  it('should handle two consecutive hot observables with error right', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const left = hot(' --a--^--b--c--|', { a: 'a', b: 'b', c: 'c' });
      const leftSubs = '      ^--------!';
      const right = hot('-----^----------d--e--f--#', { d: 'd', e: 'e', f: 'f' }, 'dun dun dun');
      const rightSubs = '     ^-------------------!';
      const expected = '      -----------x--y--z--#';

      const result = combineLatest(left, right, (x, y) => x + y);

      expectObservable(result).toBe(expected, { x: 'cd', y: 'ce', z: 'cf' }, 'dun dun dun');
      expectSubscriptions(left.subscriptions).toBe(leftSubs);
      expectSubscriptions(right.subscriptions).toBe(rightSubs);
    });
  });

  it('should handle selector throwing', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--^--b--|', { a: 1, b: 2 });
      const e1subs = '     ^--!';
      const e2 = hot('--c--^--d--|', { c: 3, d: 4 });
      const e2subs = '     ^--!';
      const expected = '   ---#';

      const result = combineLatest(e1, e2, (x, y) => {
        throw 'ha ha ' + x + ', ' + y;
      });

      expectObservable(result).toBe(expected, null, 'ha ha 2, 4');
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should allow unsubscribing early and explicitly', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--^--b--c---d-| ');
      const e1subs = '     ^--------!    ';
      const e2 = hot('---e-^---f--g---h-|');
      const e2subs = '     ^--------!    ';
      const expected = '   ----x-yz--    ';
      const unsub = '      ---------!    ';
      const values = { x: 'bf', y: 'cf', z: 'cg' };

      const result = combineLatest(e1, e2, (x, y) => x + y);

      expectObservable(result, unsub).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not break unsubscription chains when unsubscribed explicitly', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--^--b--c---d-| ');
      const e1subs = '     ^--------!    ';
      const e2 = hot('---e-^---f--g---h-|');
      const e2subs = '     ^--------!    ';
      const expected = '   ----x-yz--    ';
      const unsub = '      ---------!    ';
      const values = { x: 'bf', y: 'cf', z: 'cg' };

      const result = combineLatest(e1.pipe(mergeMap((x) => of(x))), e2.pipe(mergeMap((x) => of(x))), (x, y) => x + y).pipe(
        mergeMap((x) => of(x))
      );

      expectObservable(result, unsub).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { lowerCaseO } from '../helpers/test-helper';
import { asyncScheduler, queueScheduler, concat, of, defer, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {concat} */
describe('static concat', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should emit elements from multiple sources', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -a-b-c-|');
      const e1subs = '  ^------!';
      const e2 = cold('        -0-1-|');
      const e2subs = '  -------^----!';
      const e3 = cold('             -w-x-y-z-|');
      const e3subs = '  ------------^--------!';
      const expected = '-a-b-c--0-1--w-x-y-z-|';

      expectObservable(concat(e1, e2, e3)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
      expectSubscriptions(e3.subscriptions).toBe(e3subs);
    });
  });

  it('should concat the same cold observable multiple times', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const inner = cold('--i-j-k-l-|');
      const innersubs = [
        '                 ^---------!                              ',
        '                 ----------^---------!                    ',
        '                 --------------------^---------!          ',
        '                 ------------------------------^---------!',
      ];
      const expected = '  --i-j-k-l---i-j-k-l---i-j-k-l---i-j-k-l-|';

      const result = concat(inner, inner, inner, inner);

      expectObservable(result).toBe(expected);
      expectSubscriptions(inner.subscriptions).toBe(innersubs);
    });
  });

  it('should concat the same cold observable multiple times, but the result is unsubscribed early', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const innersubs: string[] = [];
      const inner = cold('--i-j-k-l-|     ');
      const unsub = '     ---------------!';
      innersubs[0] = '    ^---------!     ';
      innersubs[1] = '    ----------^----!';
      const expected = '  --i-j-k-l---i-j-';

      const result = concat(inner, inner, inner, inner);

      expectObservable(result, unsub).toBe(expected);
      expectSubscriptions(inner.subscriptions).toBe(innersubs);
    });
  });

  it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const innersubs: string[] = [];
      const inner = cold('--i-j-k-l-|');
      innersubs[0] = '    ^---------!';
      innersubs[1] = '    ----------^----!';
      const expected = '  --i-j-k-l---i-j-';
      const unsub = '     ---------------!';

      const innerWrapped = inner.pipe(mergeMap((x) => of(x)));
      const result = concat(innerWrapped, innerWrapped, innerWrapped, innerWrapped).pipe(mergeMap((x) => of(x)));

      expectObservable(result, unsub).toBe(expected);
      expectSubscriptions(inner.subscriptions).toBe(innersubs);
    });
  });

  it('should complete without emit if both sources are empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --|');
      const e1subs = '  ^-!';
      const e2 = cold(' ----|');
      const e2subs = '  --^---!';
      const expected = '------|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete if first source does not completes', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' --|');
      const e2subs = '  -';
      const expected = '-';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete if second source does not completes', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --|');
      const e1subs = '  ^-!';
      const e2 = cold(' ---');
      const e2subs = '  --^';
      const expected = '---';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete if both sources do not complete', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' -');
      const e2subs = '  -';
      const expected = '-';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error when first source is empty, second source raises error', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --|');
      const e1subs = '  ^-!';
      const e2 = cold(' ----#');
      const e2subs = '  --^---!';
      const expected = '------#';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error when first source raises error, second source is empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' ---#');
      const e1subs = '  ^--!';
      const e2 = cold(' ----|');
      const e2subs = '     -';
      const expected = '---#';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise first error when both source raise error', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' ---#');
      const e1subs = '  ^--!';
      const e2 = cold(' ------#');
      const e2subs = '     -';
      const expected = '---#';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should concat if first source emits once, second source is empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --a--|');
      const e1subs = '  ^----!';
      const e2 = cold(' --------|');
      const e2subs = '  -----^-------!';
      const expected = '--a----------|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should concat if first source is empty, second source emits once', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --|');
      const e1subs = '  ^-!';
      const e2 = cold(' --a--|');
      const e2subs = '  --^----!';
      const expected = '----a--|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should emit element from first source, and should not complete if second ' + 'source does not completes', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --a--|');
      const e1subs = '  ^----!';
      const e2 = cold(' -');
      const e2subs = '  -----^';
      const expected = '--a---';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete if first source does not complete', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' --a--|');
      const e2subs = '  -';
      const expected = '-';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should emit elements from each source when source emit once', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' ---a|');
      const e1subs = '  ^---!';
      const e2 = cold('     -----b--|');
      const e2subs = '  ----^-------!';
      const expected = '---a-----b--|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should unsubscribe to inner source if outer is unsubscribed early', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' ---a-a--a|            ');
      const e1subs = '  ^--------!            ';
      const e2 = cold('          -----b-b--b-|');
      const e2subs = '  ---------^-------!    ';
      const unsub = '   -----------------!    ';
      const expected = '---a-a--a-----b-b-    ';

      expectObservable(concat(e1, e2), unsub).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error from first source and does not emit from second source', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --#');
      const e1subs = '  ^-!';
      const e2 = cold(' ----a--|');
      const e2subs = '  -';
      const expected = '--#';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should emit element from first source then raise error from second source', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' --a--|');
      const e1subs = '  ^----!';
      const e2 = cold(' -------#');
      const e2subs = '  -----^------!';
      const expected = '--a---------#';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should emit all elements from both hot observable sources if first source ' + 'completes before second source starts emit', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b-|');
      const e1subs = '  ^------!';
      const e2 = hot('  --------x--y--|');
      const e2subs = '  -------^------!';
      const expected = '--a--b--x--y--|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should emit elements from second source regardless of completion time ' + 'when second source is cold observable', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c---|');
      const e1subs = '  ^-----------!';
      const e2 = cold('             -x-y-z-|');
      const e2subs = '  ------------^------!';
      const expected = '--a--b--c----x-y-z-|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not emit collapsing element from second source', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c--|');
      const e1subs = '  ^----------!';
      const e2 = hot('  --------x--y--z--|');
      const e2subs = '  -----------^-----!';
      const expected = '--a--b--c--y--z--|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should return empty if concatenating an empty source', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('|');
      const e1subs = ['(^!)', '(^!)'];
      const expected = '|';

      const result = concat(e1, e1);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should error immediately if given a just-throw source', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' #');
      const e1subs = '  (^!)';
      const expected = '#';

      const result = concat(e1, e1);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit elements from second source regardless of completion time ' + 'when second source is cold observable', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c---|');
      const e1subs = '  ^-----------!';
      const e2 = cold('             -x-y-z-|');
      const e2subs = '  ------------^------!';
      const expected = '--a--b--c----x-y-z-|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not emit collapsing element from second source', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c--|');
      const e1subs = '  ^----------!';
      const e2 = hot('  --------x--y--z--|');
      const e2subs = '  -----------^-----!';
      const expected = '--a--b--c--y--z--|';

      expectObservable(concat(e1, e2)).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should concat an immediately-scheduled source with an immediately-scheduled second', (done) => {
    const a = of(1, 2, 3, queueScheduler);
    const b = of(4, 5, 6, 7, 8, queueScheduler);
    const r = [1, 2, 3, 4, 5, 6, 7, 8];

    concat(a, b, queueScheduler).subscribe({
      next: (vals) => {
        expect(vals).to.equal(r.shift());
      },
      complete: done,
    });
  });

  it("should use the scheduler even when one Observable is concat'd", (done) => {
    let e1Subscribed = false;
    const e1 = defer(() => {
      e1Subscribed = true;
      return of('a');
    });

    concat(e1, asyncScheduler).subscribe({
      error: done,
      complete: () => {
        expect(e1Subscribed).to.be.true;
        done();
      },
    });

    expect(e1Subscribed).to.be.false;
  });

  it('should return passed observable if no scheduler was passed', () => {
    rxTestScheduler.run(({ cold, expectObservable }) => {
      const source = cold('--a---b----c---|');
      const expected = '   --a---b----c---|';
      const result = concat(source);

      expectObservable(result).toBe(expected);
    });
  });

  it('should return RxJS Observable when single lowerCaseO was passed', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = lowerCaseO('a', 'b', 'c');
      const result = concat(source);

      expect(result).to.be.an.instanceof(Observable);
      expectObservable(result).toBe('(abc|)');
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { connectable, of, ReplaySubject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

describe('connectable', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher);
  });

  it('should mirror a simple source Observable', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('--1-2---3-4--5-|');
      const sourceSubs = ' ^--------------!';
      const expected = '   --1-2---3-4--5-|';

      const obs = connectable(source);

      expectObservable(obs).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);

      obs.connect();
    });
  });

  it('should do nothing if connect is not called, despite subscriptions', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const source = cold('--1-2---3-4--5-|');
      const sourceSubs: string[] = [];
      const expected = '   -';

      const obs = connectable(source);

      expectObservable(obs).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });

  it('should support resetOnDisconnect = true', () => {
    const values: number[] = [];
    const source = of(1, 2, 3);
    const obs = connectable(source, {
      connector: () => new ReplaySubject(1),
      resetOnDisconnect: true,
    });

    obs.subscribe((value) => values.push(value));
    const connection = obs.connect();
    expect(values).to.deep.equal([1, 2, 3]);

    connection.unsubscribe();

    obs.subscribe((value) => values.push(value));
    obs.connect();
    expect(values).to.deep.equal([1, 2, 3, 1, 2, 3]);
  });

  it('should support resetOnDisconnect = false', () => {
    const values: number[] = [];
    const source = of(1, 2, 3);
    const obs = connectable(source, {
      connector: () => new ReplaySubject(1),
      resetOnDisconnect: false,
    });

    obs.subscribe((value) => values.push(value));
    const connection = obs.connect();
    expect(values).to.deep.equal([1, 2, 3]);

    connection.unsubscribe();

    obs.subscribe((value) => values.push(value));
    obs.connect();
    expect(values).to.deep.equal([1, 2, 3, 3]);
  });
});
/** @prettier */
import { expect } from 'chai';
import { defer, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {defer} */
describe('defer', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should defer the creation of a simple Observable', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const expected = '-a--b--c--|';
      const e1 = defer(() => cold('-a--b--c--|'));
      expectObservable(e1).toBe(expected);
    });
  });

  it('should create an observable from the provided observable factory', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const source = hot('--a--b--c--|');
      const sourceSubs = '^----------!';
      const expected = '  --a--b--c--|';

      const e1 = defer(() => source);

      expectObservable(e1).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });

  it('should create an observable from completed', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const source = hot('|');
      const sourceSubs = '(^!)';
      const expected = '  |';

      const e1 = defer(() => source);

      expectObservable(e1).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });

  it('should accept factory returns promise resolves', (done) => {
    const expected = 42;
    const e1 = defer(() => {
      return new Promise<number>((resolve: any) => {
        resolve(expected);
      });
    });

    e1.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expected);
        done();
      },
      error: (x: any) => {
        done(new Error('should not be called'));
      },
    });
  });

  it('should accept factory returns promise rejects', (done) => {
    const expected = 42;
    const e1 = defer(() => {
      return new Promise<number>((resolve: any, reject: any) => {
        reject(expected);
      });
    });

    e1.subscribe({
      next: (x: number) => {
        done(new Error('should not be called'));
      },
      error: (x: any) => {
        expect(x).to.equal(expected);
        done();
      },
      complete: () => {
        done(new Error('should not be called'));
      },
    });
  });

  it('should create an observable from error', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const source = hot('#');
      const sourceSubs = '(^!)';
      const expected = '  #';

      const e1 = defer(() => source);

      expectObservable(e1).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });

  it('should create an observable when factory does not throw', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = defer(() => {
        if (1 !== Infinity) {
          throw 'error';
        }
        return of();
      });
      const expected = '#';

      expectObservable(e1).toBe(expected);
    });
  });

  it('should error when factory throws', (done) => {
    const e1 = defer(() => {
      if (1 + 2 === 3) {
        throw 'error';
      }
      return of();
    });
    e1.subscribe({
      error: () => done(),
    });
  });

  it('should allow unsubscribing early and explicitly', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const source = hot('--a--b--c--|');
      const sourceSubs = '^-----!     ';
      const expected = '  --a--b-     ';
      const unsub = '     ------!     ';

      const e1 = defer(() => source);

      expectObservable(e1, unsub).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });

  it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const source = hot('--a--b--c--|');
      const sourceSubs = '^-----!     ';
      const expected = '  --a--b-     ';
      const unsub = '     ------!     ';

      const e1 = defer(() =>
        source.pipe(
          mergeMap((x: string) => of(x)),
          mergeMap((x: string) => of(x))
        )
      );

      expectObservable(e1, unsub).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { empty, EMPTY } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {empty} */
describe('empty', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should return EMPTY', () => {
    expect(empty()).to.equal(EMPTY);
  });

  it('should create a cold observable with only complete', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const expected = '|';
      const e1 = empty();
      expectObservable(e1).toBe(expected);
    });
  });

  it('should return the same instance EMPTY', () => {
    const s1 = empty();
    const s2 = empty();
    expect(s1).to.equal(s2);
  });

  it('should be synchronous by default', () => {
    const source = empty();
    let hit = false;
    source.subscribe({
      complete() {
        hit = true;
      },
    });
    expect(hit).to.be.true;
  });

  it('should equal EMPTY', () => {
    expect(empty()).to.equal(EMPTY);
  });

  it('should take a scheduler', () => {
    const source = empty(rxTestScheduler);
    let hit = false;
    source.subscribe({
      complete() {
        hit = true;
      },
    });
    expect(hit).to.be.false;
    rxTestScheduler.flush();
    expect(hit).to.be.true;
  });
});
/** @prettier */
import { expect } from 'chai';
import { finalize, forkJoin, map, of, timer } from 'rxjs';
import { lowerCaseO } from '../helpers/test-helper';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {forkJoin} */
describe('forkJoin', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should join the last values of the provided observables into an array', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable }) => {
      const s1 = hot('  -a--b-----c-d-e-|');
      const s2 = hot('  --------f--g-h-i--j-|');
      const s3 = cold(' --1--2-3-4---|');
      const e1 = forkJoin([s1, s2, s3]);
      const expected = '--------------------(x|)';

      expectObservable(e1).toBe(expected, { x: ['e', 'j', '4'] });
    });
  });

  it('should support a resultSelector with an Array of ObservableInputs', () => {
    const results: Array<number | string> = [];
    forkJoin([of(1, 2, 3), of(4, 5, 6), of(7, 8, 9)], (a: number, b: number, c: number) => a + b + c).subscribe({
      next(value) {
        results.push(value);
      },
      error(err) {
        throw err;
      },
      complete() {
        results.push('done');
      },
    });

    expect(results).to.deep.equal([18, 'done']);
  });

  it('should support a resultSelector with a spread of ObservableInputs', () => {
    const results: Array<number | string> = [];
    forkJoin(of(1, 2, 3), of(4, 5, 6), of(7, 8, 9), (a: number, b: number, c: number) => a + b + c).subscribe({
      next(value) {
        results.push(value);
      },
      error(err) {
        throw err;
      },
      complete() {
        results.push('done');
      },
    });

    expect(results).to.deep.equal([18, 'done']);
  });

  it('should accept single observable', () => {
    rxTestScheduler.run(({ hot, expectObservable }) => {
      const e1 = forkJoin(hot('--a--b--c--d--|'));
      const expected = '       --------------(x|)';

      expectObservable(e1).toBe(expected, { x: ['d'] });
    });
  });

  describe('forkJoin([input1, input2, input3])', () => {
    it('should join the last values of the provided observables into an array', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = hot('  --1--2--3--|');
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: ['d', 'b', '3'] });
      });
    });

    it('should allow emit null or undefined', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e2 = forkJoin([
          hot('            --a--b--c--d--|', { d: null }),
          hot('            (b|)'),
          hot('            --1--2--3--|'),
          hot('            -----r--t--u--|', { u: undefined }),
        ]);
        const expected2 = '--------------(x|)';

        expectObservable(e2).toBe(expected2, { x: [null, 'b', '3', undefined] });
      });
    });

    it('should accept array of observable contains single', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const e1 = forkJoin([s1]);
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: ['d'] });
      });
    });

    it('should accept lowercase-o observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = lowerCaseO('1', '2', '3');
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: ['d', 'b', '3'] });
      });
    });

    it('should accept empty lowercase-o observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = lowerCaseO();
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should accept promise', (done) => {
      rxTestScheduler.run(() => {
        const e1 = forkJoin([of(1), Promise.resolve(2)]);

        e1.subscribe({
          next: (x) => expect(x).to.deep.equal([1, 2]),
          complete: done,
        });
      });
    });

    it('should accept array of observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = hot('  --1--2--3--|');
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: ['d', 'b', '3'] });
      });
    });

    it('should not emit if any of source observable is empty', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = hot('  ------------------|');
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '------------------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete early if any of source is empty and completes before than others', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --a--b--c--d--|');
        const s2 = hot('  (b|)');
        const s3 = hot('  ---------|');
        const e1 = forkJoin([s1, s2, s3]);
        const expected = '---------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete when all sources are empty', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --------------|');
        const s2 = hot('  ---------|');
        const e1 = forkJoin([s1, s2]);
        const expected = '---------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should not complete when only source never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin([hot('--------------')]);
        const expected = '        --------------';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should not complete when one of the sources never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('--------------');
        const s2 = hot('-a---b--c--|');
        const e1 = forkJoin([s1, s2]);
        const expected = '-';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete when one of the sources never completes but other completes without values', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  --------------');
        const s2 = hot('  ------|');
        const e1 = forkJoin([s1, s2]);
        const expected = '------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete if source is not provided', () => {
      rxTestScheduler.run(({ expectObservable }) => {
        const e1 = forkJoin();
        const expected = '|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete if sources list is empty', () => {
      rxTestScheduler.run(({ expectObservable }) => {
        const e1 = forkJoin([]);
        const expected = '|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when any of source raises error with empty observable', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  ------#');
        const s2 = hot('  ---------|');
        const e1 = forkJoin([s1, s2]);
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when any of source raises error with source that never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  ------#');
        const s2 = hot('  ----------');
        const e1 = forkJoin([s1, s2]);
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when source raises error', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const s1 = hot('  ------#');
        const s2 = hot('  ---a-----|');
        const e1 = forkJoin([s1, s2]);
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should allow unsubscribing early and explicitly', () => {
      rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
        const e1 = hot('--a--^--b--c---d-| ');
        const e1subs = '     ^--------!    ';
        const e2 = hot('---e-^---f--g---h-|');
        const e2subs = '     ^--------!    ';
        const expected = '   ----------    ';
        const unsub = '      ---------!    ';

        const result = forkJoin([e1, e2]);

        expectObservable(result, unsub).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });

    it('should unsubscribe other Observables, when one of them errors', () => {
      rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
        const e1 = hot('--a--^--b--c---d-| ');
        const e1subs = '     ^--------!    ';
        const e2 = hot('---e-^---f--g-#');
        const e2subs = '     ^--------!    ';
        const expected = '   ---------#    ';

        const result = forkJoin([e1, e2]);

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });
  });

  it('should finalize in the proper order', () => {
    const results: any[] = [];
    const source = forkJoin(
      [1, 2, 3, 4].map((n) =>
        timer(100, rxTestScheduler).pipe(
          map(() => n),
          finalize(() => results.push(`finalized ${n}`))
        )
      )
    );

    source.subscribe((value) => results.push(value));
    rxTestScheduler.flush();
    expect(results).to.deep.equal(['finalized 1', 'finalized 2', 'finalized 3', 'finalized 4', [1, 2, 3, 4]]);
  });

  describe('forkJoin({ foo, bar, baz })', () => {
    it('should join the last values of the provided observables into an array', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: hot('      --1--2--3--|'),
        });
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: { foo: 'd', bar: 'b', baz: '3' } });
      });
    });

    it('should allow emit null or undefined', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e2 = forkJoin({
          foo: hot('       --a--b--c--d--|', { d: null }),
          bar: hot('       (b|)'),
          baz: hot('       --1--2--3--|'),
          qux: hot('       -----r--t--u--|', { u: undefined }),
        });
        const expected2 = '--------------(x|)';

        expectObservable(e2).toBe(expected2, { x: { foo: null, bar: 'b', baz: '3', qux: undefined } });
      });
    });

    it('should accept array of observable contains single', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
        });
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: { foo: 'd' } });
      });
    });

    it('should accept lowercase-o observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: lowerCaseO('1', '2', '3'),
        });
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: { foo: 'd', bar: 'b', baz: '3' } });
      });
    });

    it('should accept empty lowercase-o observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: lowerCaseO(),
        });
        const expected = '|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should accept promise', (done) => {
      const e1 = forkJoin({
        foo: of(1),
        bar: Promise.resolve(2),
      });

      e1.subscribe({
        next: (x) => expect(x).to.deep.equal({ foo: 1, bar: 2 }),
        complete: done,
      });
    });

    it('should accept an object of observables', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: hot('      --1--2--3--|'),
        });
        const expected = '--------------(x|)';

        expectObservable(e1).toBe(expected, { x: { foo: 'd', bar: 'b', baz: '3' } });
      });
    });

    it('should not emit if any of source observable is empty', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: hot('      ------------------|'),
        });
        const expected = '------------------|';

        expectObservable(e1).toBe(expected);
      });
    });

    // TODO: This seems odd. Filed an issue for discussion here: https://github.com/ReactiveX/rxjs/issues/5561
    it('should complete early if any of source is empty and completes before than others', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --a--b--c--d--|'),
          bar: hot('      (b|)'),
          baz: hot('      ---------|'),
        });
        const expected = '---------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete when all sources are empty', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --------------|'),
          bar: hot('      ---------|'),
        });
        const expected = '---------|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should not complete when only source never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --------------'),
        });
        const expected = '--------------';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should not complete when one of the sources never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --------------'),
          bar: hot('      -a---b--c--|'),
        });
        const expected = '--------------';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should complete when one of the sources never completes but other completes without values', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          foo: hot('      --------------'),
          bar: hot('      ------|'),
        });
        const expected = '------|';

        expectObservable(e1).toBe(expected);
      });
    });

    // TODO(benlesh): this is the wrong behavior, it should probably throw right away.
    it('should have same v5/v6 throwing behavior full argument of null', (done) => {
      rxTestScheduler.run(() => {
        // It doesn't throw when you pass null
        expect(() => forkJoin(null as any)).not.to.throw();

        // It doesn't even throw if you subscribe to forkJoin(null).
        expect(() =>
          forkJoin(null as any).subscribe({
            // It sends the error to the subscription.
            error: () => done(),
          })
        ).not.to.throw();
      });
    });

    it('should complete if sources object is empty', () => {
      rxTestScheduler.run(({ expectObservable }) => {
        const e1 = forkJoin({});
        const expected = '|';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when any of source raises error with empty observable', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          lol: hot('      ------#'),
          wut: hot('      ---------|'),
        });
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when any of source raises error with source that never completes', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          lol: hot('      ------#'),
          wut: hot('      ----------'),
        });
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should raise error when source raises error', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const e1 = forkJoin({
          lol: hot('      ------#'),
          foo: hot('      ---a-----|'),
        });
        const expected = '------#';

        expectObservable(e1).toBe(expected);
      });
    });

    it('should allow unsubscribing early and explicitly', () => {
      rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
        const e1 = hot('--a--^--b--c---d-| ');
        const e1subs = '     ^--------!    ';
        const e2 = hot('---e-^---f--g---h-|');
        const e2subs = '     ^--------!    ';
        const expected = '   ----------    ';
        const unsub = '      ---------!    ';

        const result = forkJoin({
          e1,
          e2,
        });

        expectObservable(result, unsub).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });

    it('should unsubscribe other Observables, when one of them errors', () => {
      rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
        const e1 = hot('  --a--^--b--c---d-| ');
        const e1subs = '       ^--------!    ';
        const e2 = hot('  ---e-^---f--g-#');
        const e2subs = '       ^--------!    ';
        const expected = '     ---------#    ';

        const result = forkJoin({
          e1,
          e2,
        });

        expectObservable(result).toBe(expected);
        expectSubscriptions(e1.subscriptions).toBe(e1subs);
        expectSubscriptions(e2.subscriptions).toBe(e2subs);
      });
    });

    it('should accept promise as the first arg', (done) => {
      const e1 = forkJoin(Promise.resolve(1));
      const values: number[][] = [];

      e1.subscribe({
        next: (x) => values.push(x),
        complete: () => {
          expect(values).to.deep.equal([[1]]);
          done();
        },
      });
    });
  });
});
import { expect } from 'chai';
import * as sinon from 'sinon';
import { asapScheduler, from } from 'rxjs';

declare const process: any;

/** @test {fromPromise} */
describe('from (fromPromise)', () => {
  it('should emit one value from a resolved promise', (done) => {
    const promise = Promise.resolve(42);
    from(promise)
      .subscribe(
        { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
          done(new Error('should not be called'));
        }, complete: () => {
          done();
        } });
  });

  it('should raise error from a rejected promise', (done) => {
    const promise = Promise.reject('bad');
    from(promise)
      .subscribe({ next: (x) => {
          done(new Error('should not be called'));
        }, error: (e) => {
          expect(e).to.equal('bad');
          done();
        }, complete: () => {
         done(new Error('should not be called'));
       } });
  });

  it('should share the underlying promise with multiple subscribers', (done) => {
    const promise = Promise.resolve(42);
    const observable = from(promise);

    observable
      .subscribe(
        { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
          done(new Error('should not be called'));
        } });
    setTimeout(() => {
      observable
        .subscribe(
          { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
            done(new Error('should not be called'));
          }, complete: () => {
            done();
          } });
    });
  });

  it('should accept already-resolved Promise', (done) => {
    const promise = Promise.resolve(42);
    promise.then((x) => {
      expect(x).to.equal(42);
      from(promise)
        .subscribe(
          { next: (y) => { expect(y).to.equal(42); }, error: (x) => {
            done(new Error('should not be called'));
          }, complete: () => {
            done();
          } });
    }, () => {
      done(new Error('should not be called'));
    });
  });

  it('should accept PromiseLike object for interoperability', (done) => {
    class CustomPromise<T> implements PromiseLike<T> {
      constructor(private promise: PromiseLike<T>) {
      }
      then<TResult1 = T, TResult2 = T>(
        onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
        return new CustomPromise(this.promise.then(onFulfilled, onRejected));
      }
    }
    const promise = new CustomPromise(Promise.resolve(42));
    from(promise)
      .subscribe(
        { next: (x) => { expect(x).to.equal(42); }, error: () => {
          done(new Error('should not be called'));
        }, complete: () => {
          done();
        } });
  });

  it('should emit a value from a resolved promise on a separate scheduler', (done) => {
    const promise = Promise.resolve(42);
    from(promise, asapScheduler)
      .subscribe(
        { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
          done(new Error('should not be called'));
        }, complete: () => {
          done();
        } });
  });

  it('should raise error from a rejected promise on a separate scheduler', (done) => {
    const promise = Promise.reject('bad');
    from(promise, asapScheduler)
      .subscribe(
        { next: (x) => { done(new Error('should not be called')); }, error: (e) => {
          expect(e).to.equal('bad');
          done();
        }, complete: () => {
          done(new Error('should not be called'));
        } });
  });

  it('should share the underlying promise with multiple subscribers on a separate scheduler', (done) => {
    const promise = Promise.resolve(42);
    const observable = from(promise, asapScheduler);

    observable
      .subscribe(
        { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
          done(new Error('should not be called'));
        } });
    setTimeout(() => {
      observable
        .subscribe(
          { next: (x) => { expect(x).to.equal(42); }, error: (x) => {
            done(new Error('should not be called'));
          }, complete: () => {
            done();
          } });
    });
  });

  it('should not emit, throw or complete if immediately unsubscribed', (done) => {
    const nextSpy = sinon.spy();
    const throwSpy = sinon.spy();
    const completeSpy = sinon.spy();
    const promise = Promise.resolve(42);
    const subscription = from(promise)
      .subscribe({ next: nextSpy, error: throwSpy, complete: completeSpy });
    subscription.unsubscribe();

    setTimeout(() => {
      expect(nextSpy).not.have.been.called;
      expect(throwSpy).not.have.been.called;
      expect(completeSpy).not.have.been.called;
      done();
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { TestScheduler } from 'rxjs/testing';
import { asyncScheduler, of, from, Observer, observable, Subject, noop, Subscription } from 'rxjs';
import { first, concatMap, delay, take, tap } from 'rxjs/operators';
import { ReadableStream } from 'web-streams-polyfill';
import { observableMatcher } from '../helpers/observableMatcher';

function getArguments<T>(...args: T[]) {
  return arguments;
}

/** @test {from} */
describe('from', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should create an observable from an array', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const delayTime = time('--|');
      //                --|
      //                  --|
      const expected = 'x-y-(z|)';

      const e1 = from([10, 20, 30]).pipe(
        // for the purpose of making a nice diagram, spread out the synchronous emissions
        concatMap((x, i) => of(x).pipe(delay(i === 0 ? 0 : delayTime)))
      );

      expectObservable(e1).toBe(expected, { x: 10, y: 20, z: 30 });
    });
  });

  it('should throw for non observable object', () => {
    const r = () => {
      // tslint:disable-next-line:no-any needed for the test
      from({} as any).subscribe();
    };

    expect(r).to.throw();
  });

  it('should finalize an AsyncGenerator', (done) => {
    const results: any[] = [];
    const sideEffects: any[] = [];

    async function* gen() {
      try {
        let i = 0;
        while (true) {
          sideEffects.push(i);
          yield await i++;
        }
      } finally {
        results.push('finalized generator');
      }
    }

    const source = from(gen()).pipe(take(3));

    source.subscribe({
      next: (value) => results.push(value),
      complete: () => {
        results.push('done');
        setTimeout(() => {
          expect(sideEffects).to.deep.equal([0, 1, 2]);
          expect(results).to.deep.equal([0, 1, 2, 'done', 'finalized generator']);
          done();
        });
      },
    });
  });

  it('should finalize an AsyncGenerator on error', (done) => {
    const results: any[] = [];
    const sideEffects: any[] = [];

    async function* gen() {
      try {
        let i = 0;
        while (true) {
          sideEffects.push(i);
          yield await i++;
        }
      } finally {
        results.push('finalized generator');
      }
    }

    const source = from(gen()).pipe(
      tap({
        next: (value) => {
          if (value === 2) {
            throw new Error('weee');
          }
        },
      })
    );

    source.subscribe({
      next: (value) => results.push(value),
      error: () => {
        results.push('in error');
        setTimeout(() => {
          expect(sideEffects).to.deep.equal([0, 1, 2]);
          expect(results).to.deep.equal([0, 1, 'in error', 'finalized generator']);
          done();
        });
      },
    });
  });

  it('should finalize an AsyncGenerator on unsubscribe', (done) => {
    const results: any[] = [];
    const sideEffects: any[] = [];
    let subscription: Subscription;

    async function* gen() {
      try {
        let i = 0;
        while (true) {
          sideEffects.push(i);
          yield await i++;
          if (i === 2) {
            subscription.unsubscribe();
          }
        }
      } finally {
        results.push('finalized generator');
        expect(sideEffects).to.deep.equal([0, 1, 2]);
        expect(results).to.deep.equal([0, 1, 'finalized generator']);
        done();
      }
    }

    const source = from(gen());

    subscription = source.subscribe((value) => results.push(value));
  });

  it('should finalize a generator', () => {
    const results: any[] = [];

    function* gen() {
      try {
        let i = 0;
        while (true) {
          yield i++;
        }
      } finally {
        results.push('finalized generator');
      }
    }

    const source = from(gen()).pipe(take(3));

    source.subscribe({
      next: (value) => results.push(value),
      complete: () => results.push('done'),
    });

    expect(results).to.deep.equal([0, 1, 2, 'done', 'finalized generator']);
  });

  const fakervable = <T>(...values: T[]) => ({
    [observable]: () => ({
      subscribe: (observer: Observer<T>) => {
        for (const value of values) {
          observer.next(value);
        }
        observer.complete();
      },
    }),
  });

  const fakeArrayObservable = <T>(...values: T[]) => {
    let arr: any = ['bad array!'];
    arr[observable] = () => {
      return {
        subscribe: (observer: Observer<T>) => {
          for (const value of values) {
            observer.next(value);
          }
          observer.complete();
        },
      };
    };
    return arr;
  };

  const fakerator = <T>(...values: T[]) => ({
    [Symbol.iterator as symbol]: () => {
      const clone = [...values];
      return {
        next: () => ({
          done: clone.length <= 0,
          value: clone.shift(),
        }),
      };
    },
  });

  // tslint:disable-next-line:no-any it's silly to define all of these types.
  const sources: Array<{ name: string; createValue: () => any }> = [
    { name: 'observable', createValue: () => of('x') },
    { name: 'observable-like', createValue: () => fakervable('x') },
    { name: 'observable-like-array', createValue: () => fakeArrayObservable('x') },
    { name: 'array', createValue: () => ['x'] },
    { name: 'promise', createValue: () => Promise.resolve('x') },
    { name: 'iterator', createValue: () => fakerator('x') },
    { name: 'array-like', createValue: () => ({ [0]: 'x', length: 1 }) },
    // ReadableStreams are not lazy, so we have to have this createValue() thunk
    // so that each tests gets a new one.
    {
      name: 'readable-stream-like',
      createValue: () =>
        new ReadableStream({
          pull(controller) {
            controller.enqueue('x');
            controller.close();
          },
        }),
    },
    { name: 'string', createValue: () => 'x' },
    { name: 'arguments', createValue: () => getArguments('x') },
  ];

  if (Symbol && Symbol.asyncIterator) {
    const fakeAsyncIterator = (...values: any[]) => {
      return {
        [Symbol.asyncIterator]() {
          let i = 0;
          return {
            next() {
              const index = i++;
              if (index < values.length) {
                return Promise.resolve({ done: false, value: values[index] });
              } else {
                return Promise.resolve({ done: true });
              }
            },
            [Symbol.asyncIterator]() {
              return this;
            },
          };
        },
      };
    };

    sources.push({
      name: 'async-iterator',
      createValue: () => fakeAsyncIterator('x'),
    });
  }

  for (const source of sources) {
    it(`should accept ${source.name}`, (done) => {
      let nextInvoked = false;
      from(source.createValue()).subscribe({
        next: (x) => {
          nextInvoked = true;
          expect(x).to.equal('x');
        },
        error: (x) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          expect(nextInvoked).to.equal(true);
          done();
        },
      });
    });
    it(`should accept ${source.name} and scheduler`, (done) => {
      let nextInvoked = false;
      from(source.createValue(), asyncScheduler).subscribe({
        next: (x) => {
          nextInvoked = true;
          expect(x).to.equal('x');
        },
        error: (x) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          expect(nextInvoked).to.equal(true);
          done();
        },
      });
      expect(nextInvoked).to.equal(false);
    });

    it(`should accept a function that implements [Symbol.observable]`, (done) => {
      const subject = new Subject<any>();
      const handler: any = (arg: any) => subject.next(arg);
      handler[observable] = () => subject;
      let nextInvoked = false;

      from(handler as any)
        .pipe(first())
        .subscribe({
          next: (x) => {
            nextInvoked = true;
            expect(x).to.equal('x');
          },
          error: (x) => {
            done(new Error('should not be called'));
          },
          complete: () => {
            expect(nextInvoked).to.equal(true);
            done();
          },
        });
      handler('x');
    });

    it('should accept a thennable that happens to have a subscribe method', (done) => {
      // There was an issue with our old `isPromise` check that caused this to fail
      const input = Promise.resolve('test');
      (input as any).subscribe = noop;
      from(input).subscribe({
        next: (x) => {
          expect(x).to.equal('test');
          done();
        },
      });
    });
  }

  it('should appropriately handle errors from an iterator', () => {
    const erroringIterator = (function* () {
      for (let i = 0; i < 5; i++) {
        if (i === 3) {
          throw new Error('bad');
        }
        yield i;
      }
    })();

    const results: any[] = [];

    from(erroringIterator).subscribe({
      next: (x) => results.push(x),
      error: (err) => results.push(err.message),
    });

    expect(results).to.deep.equal([0, 1, 2, 'bad']);
  });

  it('should execute the finally block of a generator', () => {
    let finallyExecuted = false;
    const generator = (function* () {
      try {
        yield 'hi';
      } finally {
        finallyExecuted = true;
      }
    })();

    from(generator).subscribe();

    expect(finallyExecuted).to.be.true;
  });

  it('should support ReadableStream-like objects', (done) => {
    const input = [0, 1, 2];
    const output: number[] = [];

    const readableStream = new ReadableStream({
      pull(controller) {
        if (input.length > 0) {
          controller.enqueue(input.shift());

          if (input.length === 0) {
            controller.close();
          }
        }
      },
    });

    from(readableStream).subscribe({
      next: (value) => {
        output.push(value);
        expect(readableStream.locked).to.equal(true);
      },
      complete: () => {
        expect(output).to.deep.equal([0, 1, 2]);
        expect(readableStream.locked).to.equal(false);
        done();
      },
    });
  });

  it('should lock and release ReadableStream-like objects', (done) => {
    const input = [0, 1, 2];
    const output: number[] = [];

    const readableStream = new ReadableStream({
      pull(controller) {
        if (input.length > 0) {
          controller.enqueue(input.shift());

          if (input.length === 0) {
            controller.close();
          }
        }
      },
    });

    from(readableStream).subscribe({
      next: (value) => {
        output.push(value);
        expect(readableStream.locked).to.equal(true);
      },
      complete: () => {
        expect(output).to.deep.equal([0, 1, 2]);
        expect(readableStream.locked).to.equal(false);
        done();
      },
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { fromEvent, NEVER, timer } from 'rxjs';
import { mapTo, take, concat } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {fromEvent} */
describe('fromEvent', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should create an observable of click on the element', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const delay1 = time('-----|     ');
      const delay2 = time('     --|   ');
      const expected = '   -----x-x---';

      const target = {
        addEventListener: (eventType: any, listener: any) => {
          timer(delay1, delay2).pipe(mapTo('ev'), take(2), concat(NEVER)).subscribe(listener);
        },
        removeEventListener: (): void => void 0,
        dispatchEvent: (): void => void 0,
      };
      const e1 = fromEvent(target as any, 'click');
      expectObservable(e1).toBe(expected, { x: 'ev' });
    });
  });

  it('should setup an event observable on objects with "on" and "off" ', () => {
    let onEventName;
    let onHandler;
    let offEventName;
    let offHandler;

    const obj = {
      on: (a: string, b: Function) => {
        onEventName = a;
        onHandler = b;
      },
      off: (a: string, b: Function) => {
        offEventName = a;
        offHandler = b;
      },
    };

    const subscription = fromEvent(obj, 'click').subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onEventName).to.equal('click');
    expect(typeof onHandler).to.equal('function');
    expect(offEventName).to.equal(onEventName);
    expect(offHandler).to.equal(onHandler);
  });

  it('should setup an event observable on objects with "addEventListener" and "removeEventListener" ', () => {
    let onEventName;
    let onHandler;
    let offEventName;
    let offHandler;

    const obj = {
      addEventListener: (a: string, b: EventListenerOrEventListenerObject, useCapture?: boolean) => {
        onEventName = a;
        onHandler = b;
      },
      removeEventListener: (a: string, b: EventListenerOrEventListenerObject, useCapture?: boolean) => {
        offEventName = a;
        offHandler = b;
      },
    };

    const subscription = fromEvent(<any>obj, 'click').subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onEventName).to.equal('click');
    expect(typeof onHandler).to.equal('function');
    expect(offEventName).to.equal(onEventName);
    expect(offHandler).to.equal(onHandler);
  });

  it('should setup an event observable on objects with "addListener" and "removeListener" returning event emitter', () => {
    let onEventName;
    let onHandler;
    let offEventName;
    let offHandler;

    const obj = {
      addListener(a: string | symbol, b: (...args: any[]) => void) {
        onEventName = a;
        onHandler = b;
        return this;
      },
      removeListener(a: string | symbol, b: (...args: any[]) => void) {
        offEventName = a;
        offHandler = b;
        return this;
      },
    };

    const subscription = fromEvent(obj, 'click').subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onEventName).to.equal('click');
    expect(typeof onHandler).to.equal('function');
    expect(offEventName).to.equal(onEventName);
    expect(offHandler).to.equal(onHandler);
  });

  it('should setup an event observable on objects with "addListener" and "removeListener" returning nothing', () => {
    let onEventName;
    let onHandler;
    let offEventName;
    let offHandler;

    const obj = {
      addListener(a: string, b: (...args: any[]) => any, context?: any): { context: any } {
        onEventName = a;
        onHandler = b;
        return { context: '' };
      },
      removeListener(a: string, b: (...args: any[]) => void) {
        offEventName = a;
        offHandler = b;
      },
    };

    const subscription = fromEvent(obj, 'click').subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onEventName).to.equal('click');
    expect(typeof onHandler).to.equal('function');
    expect(offEventName).to.equal(onEventName);
    expect(offHandler).to.equal(onHandler);
  });

  it('should setup an event observable on objects with "addListener" and "removeListener" and "length" ', () => {
    let onEventName;
    let onHandler;
    let offEventName;
    let offHandler;

    const obj = {
      addListener: (a: string, b: Function) => {
        onEventName = a;
        onHandler = b;
      },
      removeListener: (a: string, b: Function) => {
        offEventName = a;
        offHandler = b;
      },
      length: 1,
    };

    const subscription = fromEvent(obj, 'click').subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onEventName).to.equal('click');
    expect(typeof onHandler).to.equal('function');
    expect(offEventName).to.equal(onEventName);
    expect(offHandler).to.equal(onHandler);
  });

  it('should throw if passed an invalid event target', () => {
    const obj = {
      addListener: () => {
        //noop
      },
    };
    expect(() => {
      fromEvent(obj as any, 'click');
    }).to.throw(/Invalid event target/);
  });

  it('should pass through options to addEventListener and removeEventListener', () => {
    let onOptions;
    let offOptions;
    const expectedOptions = { capture: true, passive: true };

    const obj = {
      addEventListener: (a: string, b: EventListenerOrEventListenerObject, c?: any) => {
        onOptions = c;
      },
      removeEventListener: (a: string, b: EventListenerOrEventListenerObject, c?: any) => {
        offOptions = c;
      },
    };

    const subscription = fromEvent(<any>obj, 'click', expectedOptions).subscribe(() => {
      //noop
    });

    subscription.unsubscribe();

    expect(onOptions).to.equal(expectedOptions);
    expect(offOptions).to.equal(expectedOptions);
  });

  it('should pass through events that occur', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    fromEvent(obj, 'click')
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).to.equal('test');
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send('test');
  });

  it('should pass through events that occur and use the selector if provided', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    function selector(x: string) {
      return x + '!';
    }

    fromEvent(obj, 'click', selector)
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).to.equal('test!');
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send('test');
  });

  it('should not fail if no event arguments are passed and the selector does not return', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    function selector() {
      //noop
    }

    fromEvent(obj, 'click', selector)
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).not.exist;
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send();
  });

  it('should return a value from the selector if no event arguments are passed', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    function selector() {
      return 'no arguments';
    }

    fromEvent(obj, 'click', selector)
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).to.equal('no arguments');
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send();
  });

  it('should pass multiple arguments to selector from event emitter', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    function selector(x: number, y: number, z: number) {
      return [].slice.call(arguments);
    }

    fromEvent(obj, 'click', selector)
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).to.deep.equal([1, 2, 3]);
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send(1, 2, 3);
  });

  it('should emit multiple arguments from event as an array', (done) => {
    let send: any;
    const obj = {
      on: (name: string, handler: Function) => {
        send = handler;
      },
      off: () => {
        //noop
      },
    };

    fromEvent(obj, 'click')
      .pipe(take(1))
      .subscribe({
        next: (e: any) => {
          expect(e).to.deep.equal([1, 2, 3]);
        },
        error: (err: any) => {
          done(new Error('should not be called'));
        },
        complete: () => {
          done();
        },
      });

    send(1, 2, 3);
  });

  it('should not throw an exception calling toString on obj with a null prototype', (done) => {
    // NOTE: Can not test with Object.create(null) or `class Foo extends null`
    // due to TypeScript bug. https://github.com/Microsoft/TypeScript/issues/1108
    class NullProtoEventTarget {
      on() {
        /*noop*/
      }
      off() {
        /*noop*/
      }
    }
    NullProtoEventTarget.prototype.toString = null!;
    const obj: NullProtoEventTarget = new NullProtoEventTarget();

    expect(() => {
      fromEvent(obj, 'foo').subscribe();
      done();
    }).to.not.throw(TypeError);
  });

  it('should handle adding events to an arraylike of targets', () => {
    const nodeList = {
      [0]: {
        addEventListener(...args: any[]) {
          this._addEventListenerArgs = args;
        },
        removeEventListener(...args: any[]) {
          this._removeEventListenerArgs = args;
        },
        _addEventListenerArgs: null as any,
        _removeEventListenerArgs: null as any,
      },
      [1]: {
        addEventListener(...args: any[]) {
          this._addEventListenerArgs = args;
        },
        removeEventListener(...args: any[]) {
          this._removeEventListenerArgs = args;
        },
        _addEventListenerArgs: null as any,
        _removeEventListenerArgs: null as any,
      },
      length: 2,
    };

    const options = {};

    const subscription = fromEvent(nodeList, 'click', options).subscribe();

    expect(nodeList[0]._addEventListenerArgs[0]).to.equal('click');
    expect(nodeList[0]._addEventListenerArgs[1]).to.be.a('function');
    expect(nodeList[0]._addEventListenerArgs[2]).to.equal(options);

    expect(nodeList[1]._addEventListenerArgs[0]).to.equal('click');
    expect(nodeList[1]._addEventListenerArgs[1]).to.be.a('function');
    expect(nodeList[1]._addEventListenerArgs[2]).to.equal(options);

    expect(nodeList[0]._removeEventListenerArgs).to.be.null;
    expect(nodeList[1]._removeEventListenerArgs).to.be.null;

    subscription.unsubscribe();

    expect(nodeList[0]._removeEventListenerArgs).to.deep.equal(nodeList[0]._addEventListenerArgs);
    expect(nodeList[1]._removeEventListenerArgs).to.deep.equal(nodeList[1]._addEventListenerArgs);
  });
});
import { expect } from 'chai';
import * as sinon from 'sinon';
import { expectObservable } from '../helpers/marble-testing';

import { fromEventPattern, noop, NEVER, timer } from 'rxjs';
import { mapTo, take, concat } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

declare const rxTestScheduler: TestScheduler;

/** @test {fromEventPattern} */
describe('fromEventPattern', () => {
  it('should create an observable from the handler API', () => {
    function addHandler(h: any) {
      timer(50, 20, rxTestScheduler).pipe(
        mapTo('ev'),
        take(2),
        concat(NEVER)
      ).subscribe(h);
    }
    const e1 = fromEventPattern(addHandler);
    const expected = '-----x-x---';
    expectObservable(e1).toBe(expected, {x: 'ev'});
  });

  it('should call addHandler on subscription', () => {
    const addHandler = sinon.spy();
    fromEventPattern(addHandler, noop).subscribe(noop);

    const call = addHandler.getCall(0);
    expect(addHandler).calledOnce;
    expect(call.args[0]).to.be.a('function');
  });

  it('should call removeHandler on unsubscription', () => {
    const removeHandler = sinon.spy();

    fromEventPattern(noop, removeHandler).subscribe(noop).unsubscribe();

    const call = removeHandler.getCall(0);
    expect(removeHandler).calledOnce;
    expect(call.args[0]).to.be.a('function');
  });

  it('should work without optional removeHandler', () => {
    const addHandler: (h: Function) => any = sinon.spy();
    fromEventPattern(addHandler).subscribe(noop);

    expect(addHandler).calledOnce;
  });

  it('should deliver return value of addHandler to removeHandler as signal', () => {
    const expected = { signal: true};
    const addHandler = () => expected;
    const removeHandler = sinon.spy();
    fromEventPattern(addHandler, removeHandler).subscribe(noop).unsubscribe();

    const call = removeHandler.getCall(0);
    expect(call).calledWith(sinon.match.any, expected);
  });

  it('should send errors in addHandler down the error path', (done) => {
    fromEventPattern((h: any) => {
      throw 'bad';
    }, noop).subscribe(
      { next: () => done(new Error('should not be called')), error: (err: any) => {
        expect(err).to.equal('bad');
        done();
      }, complete: () => done(new Error('should not be called')) });
  });

  it('should accept a selector that maps outgoing values', (done) => {
    let target: any;
    const trigger = function (...args: any[]) {
      if (target) {
        target.apply(null, arguments);
      }
    };

    const addHandler = (handler: any) => {
      target = handler;
    };
    const removeHandler = (handler: any) => {
      target = null;
    };
    const selector = (a: any, b: any) => {
      return a + b + '!';
    };

    fromEventPattern(addHandler, removeHandler, selector).pipe(take(1))
      .subscribe({ next: (x: any) => {
        expect(x).to.equal('testme!');
      }, error: (err: any) => {
        done(new Error('should not be called'));
      }, complete: () => {
        done();
      } });

    trigger('test', 'me');
  });

  it('should send errors in the selector down the error path', (done) => {
    let target: any;
    const trigger = (value: any) => {
      if (target) {
        target(value);
      }
    };

    const addHandler = (handler: any) => {
      target = handler;
    };
    const removeHandler = (handler: any) => {
      target = null;
    };
    const selector = (x: any) => {
      throw 'bad';
    };

    fromEventPattern(addHandler, removeHandler, selector)
      .subscribe({ next: (x: any) => {
        done(new Error('should not be called'));
      }, error: (err: any) => {
        expect(err).to.equal('bad');
        done();
      }, complete: () => {
        done(new Error('should not be called'));
      } });

    trigger('test');
  });
});
/** @prettier */
import { TestScheduler } from 'rxjs/testing';
import { expect } from 'chai';
import { generate } from 'rxjs';
import { take } from 'rxjs/operators';
import { SafeSubscriber } from 'rxjs/internal/Subscriber';
import { observableMatcher } from '../helpers/observableMatcher';

function err(): any {
  throw 'error';
}

describe('generate', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should complete if condition does not meet', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate(
        1,
        (x) => false,
        (x) => x + 1
      );
      const expected = '|';

      expectObservable(source).toBe(expected);
    });
  });

  it('should produce first value immediately', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate(
        1,
        (x) => x == 1,
        (x) => x + 1
      );
      const expected = '(1|)';

      expectObservable(source).toBe(expected, { '1': 1 });
    });
  });

  it('should produce all values synchronously', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate(
        1,
        (x) => x < 3,
        (x) => x + 1
      );
      const expected = '(12|)';

      expectObservable(source).toBe(expected, { '1': 1, '2': 2 });
    });
  });

  it('should use result selector', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate(
        1,
        (x) => x < 3,
        (x) => x + 1,
        (x) => (x + 1).toString()
      );
      const expected = '(23|)';

      expectObservable(source).toBe(expected);
    });
  });

  it('should allow omit condition', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x + 1,
        resultSelector: (x: number) => x.toString(),
      }).pipe(take(5));
      const expected = '(12345|)';

      expectObservable(source).toBe(expected);
    });
  });

  it('should stop producing when unsubscribed', () => {
    const source = generate(
      1,
      (x) => x < 4,
      (x) => x + 1
    );
    let count = 0;
    const subscriber = new SafeSubscriber<number>((x) => {
      count++;
      if (x == 2) {
        subscriber.unsubscribe();
      }
    });
    source.subscribe(subscriber);
    expect(count).to.be.equal(2);
  });

  it('should accept a scheduler', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        condition: (x) => x < 4,
        iterate: (x) => x + 1,
        resultSelector: (x: number) => x,
        scheduler: rxTestScheduler,
      });
      const expected = '(123|)';

      let count = 0;
      source.subscribe((x) => count++);

      expect(count).to.be.equal(0);
      rxTestScheduler.flush();
      expect(count).to.be.equal(3);

      expectObservable(source).toBe(expected, { '1': 1, '2': 2, '3': 3 });
    });
  });

  it('should allow minimal possible options', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x * 2,
      }).pipe(take(3));
      const expected = '(124|)';

      expectObservable(source).toBe(expected, { '1': 1, '2': 2, '4': 4 });
    });
  });

  it('should emit error if result selector throws', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x * 2,
        resultSelector: err,
      });
      const expected = '(#)';

      expectObservable(source).toBe(expected);
    });
  });

  it('should emit error if result selector throws on scheduler', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x * 2,
        resultSelector: err,
        scheduler: rxTestScheduler,
      });
      const expected = '(#)';

      expectObservable(source).toBe(expected);
    });
  });

  it('should emit error after first value if iterate function throws', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: err,
      });
      const expected = '(1#)';

      expectObservable(source).toBe(expected, { '1': 1 });
    });
  });

  it('should emit error after first value if iterate function throws on scheduler', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: err,
        scheduler: rxTestScheduler,
      });
      const expected = '(1#)';

      expectObservable(source).toBe(expected, { '1': 1 });
    });
  });

  it('should emit error if condition function throws', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x + 1,
        condition: err,
      });
      const expected = '(#)';

      expectObservable(source).toBe(expected);
    });
  });

  it('should emit error if condition function throws on scheduler', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = generate({
        initialState: 1,
        iterate: (x) => x + 1,
        condition: err,
        scheduler: rxTestScheduler,
      });
      const expected = '(#)';

      expectObservable(source).toBe(expected);
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { iif, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

describe('iif', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should subscribe to thenSource when the conditional returns true', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = iif(() => true, of('a'), of());
      const expected = '(a|)';

      expectObservable(e1).toBe(expected);
    });
  });

  it('should subscribe to elseSource when the conditional returns false', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = iif(() => false, of('a'), of('b'));
      const expected = '(b|)';

      expectObservable(e1).toBe(expected);
    });
  });

  it('should complete without an elseSource when the conditional returns false', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = iif(() => false, of('a'), of());
      const expected = '|';

      expectObservable(e1).toBe(expected);
    });
  });

  it('should raise error when conditional throws', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = iif(
        (): boolean => {
          throw 'error';
        },
        of('a'),
        of()
      );

      const expected = '#';

      expectObservable(e1).toBe(expected);
    });
  });

  it('should accept resolved promise as thenSource', (done) => {
    const expected = 42;
    const e1 = iif(
      () => true,
      new Promise((resolve: any) => {
        resolve(expected);
      }),
      of()
    );

    e1.subscribe({
      next: (x) => {
        expect(x).to.equal(expected);
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  it('should accept resolved promise as elseSource', (done) => {
    const expected = 42;
    const e1 = iif(
      () => false,
      of('a'),
      new Promise((resolve: any) => {
        resolve(expected);
      })
    );

    e1.subscribe({
      next: (x) => {
        expect(x).to.equal(expected);
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  it('should accept rejected promise as elseSource', (done) => {
    const expected = 42;
    const e1 = iif(
      () => false,
      of('a'),
      new Promise((resolve: any, reject: any) => {
        reject(expected);
      })
    );

    e1.subscribe({
      next: (x) => {
        done(new Error('should not be called'));
      },
      error: (x) => {
        expect(x).to.equal(expected);
        done();
      },
      complete: () => {
        done(new Error('should not be called'));
      },
    });
  });

  it('should accept rejected promise as thenSource', (done) => {
    const expected = 42;
    const e1 = iif(
      () => true,
      new Promise((resolve: any, reject: any) => {
        reject(expected);
      }),
      of()
    );

    e1.subscribe({
      next: (x) => {
        done(new Error('should not be called'));
      },
      error: (x) => {
        expect(x).to.equal(expected);
        done();
      },
      complete: () => {
        done(new Error('should not be called'));
      },
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { NEVER, interval, asapScheduler, animationFrameScheduler, queueScheduler } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { take, concat } from 'rxjs/operators';
import * as sinon from 'sinon';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {interval} */
describe('interval', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should set up an interval', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const period = time('----------|                                                                 ');
      //                             ----------|
      //                                       ----------|
      //                                                 ----------|
      //                                                           ----------|
      //                                                                     ----------|
      //                                                                               ----------|
      const unsubs = '     ---------------------------------------------------------------------------!';
      const expected = '   ----------0---------1---------2---------3---------4---------5---------6-----';
      expectObservable(interval(period), unsubs).toBe(expected, [0, 1, 2, 3, 4, 5, 6]);
    });
  });

  it('should emit when relative interval set to zero', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const period = time('|         ');
      const expected = '   (0123456|)';

      const e1 = interval(period).pipe(take(7));
      expectObservable(e1).toBe(expected, [0, 1, 2, 3, 4, 5, 6]);
    });
  });

  it('should consider negative interval as zero', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const expected = '(0123456|)';
      const e1 = interval(-1).pipe(take(7));
      expectObservable(e1).toBe(expected, [0, 1, 2, 3, 4, 5, 6]);
    });
  });

  it('should emit values until unsubscribed', (done) => {
    const values: number[] = [];
    const expected = [0, 1, 2, 3, 4, 5, 6];
    const e1 = interval(5);
    const subscription = e1.subscribe({
      next: (x: number) => {
        values.push(x);
        if (x === 6) {
          subscription.unsubscribe();
          expect(values).to.deep.equal(expected);
          done();
        }
      },
      error: (err: any) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done(new Error('should not be called'));
      },
    });
  });

  it('should create an observable emitting periodically with the AsapScheduler', (done) => {
    const sandbox = sinon.createSandbox();
    const fakeTimer = sandbox.useFakeTimers();
    const period = 10;
    const events = [0, 1, 2, 3, 4, 5];
    const source = interval(period, asapScheduler).pipe(take(6));
    source.subscribe({
      next(x) {
        expect(x).to.equal(events.shift());
      },
      error(e) {
        sandbox.restore();
        done(e);
      },
      complete() {
        expect(asapScheduler.actions.length).to.equal(0);
        expect(asapScheduler._scheduled).to.equal(undefined);
        sandbox.restore();
        done();
      },
    });
    let i = -1,
      n = events.length;
    while (++i < n) {
      fakeTimer.tick(period);
    }
  });

  it('should create an observable emitting periodically with the QueueScheduler', (done) => {
    const sandbox = sinon.createSandbox();
    const fakeTimer = sandbox.useFakeTimers();
    const period = 10;
    const events = [0, 1, 2, 3, 4, 5];
    const source = interval(period, queueScheduler).pipe(take(6));
    source.subscribe({
      next(x) {
        expect(x).to.equal(events.shift());
      },
      error(e) {
        sandbox.restore();
        done(e);
      },
      complete() {
        expect(queueScheduler.actions.length).to.equal(0);
        expect(queueScheduler._scheduled).to.equal(undefined);
        sandbox.restore();
        done();
      },
    });
    let i = -1,
      n = events.length;
    while (++i < n) {
      fakeTimer.tick(period);
    }
  });

  it('should create an observable emitting periodically with the AnimationFrameScheduler', (done) => {
    const sandbox = sinon.createSandbox();
    const fakeTimer = sandbox.useFakeTimers();
    const period = 10;
    const events = [0, 1, 2, 3, 4, 5];
    const source = interval(period, animationFrameScheduler).pipe(take(6));
    source.subscribe({
      next(x) {
        expect(x).to.equal(events.shift());
      },
      error(e) {
        sandbox.restore();
        done(e);
      },
      complete() {
        expect(animationFrameScheduler.actions.length).to.equal(0);
        expect(animationFrameScheduler._scheduled).to.equal(undefined);
        sandbox.restore();
        done();
      },
    });
    let i = -1,
      n = events.length;
    while (++i < n) {
      fakeTimer.tick(period);
    }
  });
});
/** @prettier */
import { expect } from 'chai';
import { lowerCaseO } from '../helpers/test-helper';
import { TestScheduler } from 'rxjs/testing';
import { merge, of, Observable, defer, asyncScheduler } from 'rxjs';
import { delay } from 'rxjs/operators';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {merge} */
describe('static merge(...observables)', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should merge cold and cold', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' ---a-----b-----c----|   ');
      const e1subs = '  ^-------------------!   ';
      const e2 = cold(' ------x-----y-----z----|');
      const e2subs = '  ^----------------------!';
      const expected = '---a--x--b--y--c--z----|';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should return itself when try to merge single observable', () => {
    const e1 = of('a');
    const result = merge(e1);

    expect(e1).to.equal(result);
  });

  it('should merge hot and hot', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot(' ---a---^-b-----c----|   ');
      const e1subs = '        ^------------!   ';
      const e2 = hot(' -----x-^----y-----z----|');
      const e2subs = '        ^---------------!';
      const expected = '      --b--y--c--z----|';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge hot and cold', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = hot(' ---a-^---b-----c----|    ');
      const e1subs = '      ^--------------!    ';
      const e2 = cold('     --x-----y-----z----|');
      const e2subs = '      ^------------------!';
      const expected = '    --x-b---y-c---z----|';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge parallel emissions', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  ---a----b----c----|');
      const e1subs = '  ^-----------------!';
      const e2 = hot('  ---x----y----z----|');
      const e2subs = '  ^-----------------!';
      const expected = '---(ax)-(by)-(cz)-|';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge empty and empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('|   ');
      const e1subs = ' (^!)';
      const e2 = cold('|   ');
      const e2subs = ' (^!)';
      const expected = '|  ';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge three empties', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('|   ');
      const e1subs = ' (^!)';
      const e2 = cold('|   ');
      const e2subs = ' (^!)';
      const e3 = cold('|   ');
      const e3subs = ' (^!)';
      const expected = '|  ';

      const result = merge(e1, e2, e3);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
      expectSubscriptions(e3.subscriptions).toBe(e3subs);
    });
  });

  it('should merge never and empty', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('-   ');
      const e1subs = ' ^   ';
      const e2 = cold('|   ');
      const e2subs = ' (^!)';
      const expected = '-  ';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge never and never', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -');
      const e1subs = '  ^';
      const e2 = cold(' -');
      const e2subs = '  ^';
      const expected = '-';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge empty and throw', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' |   ');
      const e1subs = '  (^!)';
      const e2 = cold(' #   ');
      const e2subs = '  (^!)';
      const expected = '#';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge hot and throw', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c--|');
      const e1subs = '  (^!)        ';
      const e2 = cold(' #           ');
      const e2subs = '  (^!)        ';
      const expected = '#           ';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge never and throw', () => {
    rxTestScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' -   ');
      const e1subs = '  (^!)';
      const e2 = cold(' #   ');
      const e2subs = '  (^!)';
      const expected = '#   ';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge empty and eventual error', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold(' |       ');
      const e1subs = '  (^!)    ';
      const e2 = hot('  -------#');
      const e2subs = '  ^------!';
      const expected = '-------#';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge hot and error', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --a--b--c--|');
      const e1subs = '  ^------!    ';
      const e2 = hot('  -------#    ');
      const e2subs = '  ^------!    ';
      const expected = '--a--b-#    ';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge never and error', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('  --------');
      const e1subs = '  ^------!';
      const e2 = hot('  -------#');
      const e2subs = '  ^------!';
      const expected = '-------#';

      const result = merge(e1, e2);

      expectObservable(result).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should merge single lowerCaseO into RxJS Observable', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = lowerCaseO('a', 'b', 'c');

      const result = merge(e1);

      expect(result).to.be.instanceof(Observable);
      expectObservable(result).toBe('(abc|)');
    });
  });

  it('should merge two lowerCaseO into RxJS Observable', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = lowerCaseO('a', 'b', 'c');
      const e2 = lowerCaseO('d', 'e', 'f');

      const result = merge(e1, e2);

      expect(result).to.be.instanceof(Observable);
      expectObservable(result).toBe('(abcdef|)');
    });
  });
});

describe('merge(...observables, Scheduler)', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should merge single lowerCaseO into RxJS Observable', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = lowerCaseO('a', 'b', 'c');

      const result = merge(e1, rxTestScheduler);

      expect(result).to.be.instanceof(Observable);
      expectObservable(result).toBe('(abc|)');
    });
  });
});

describe('merge(...observables, Scheduler, number)', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should handle concurrency limits', () => {
    rxTestScheduler.run(({ cold, expectObservable }) => {
      const e1 = cold(' ---a---b---c---|            ');
      const e2 = cold(' -d---e---f--|               ');
      const e3 = cold('             ---x---y---z---|');
      const expected = '-d-a-e-b-f-c---x---y---z---|';
      expectObservable(merge(e1, e2, e3, 2)).toBe(expected);
    });
  });

  it('should handle scheduler', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const delayTime = time('--|');
      const e1 = of('a');
      const e2 = of('b').pipe(delay(delayTime));
      const expected = 'a-(b|)';

      expectObservable(merge(e1, e2, rxTestScheduler)).toBe(expected);
    });
  });

  it('should handle scheduler with concurrency limits', () => {
    rxTestScheduler.run(({ cold, expectObservable }) => {
      const e1 = cold(' ---a---b---c---|            ');
      const e2 = cold(' -d---e---f--|               ');
      const e3 = cold('             ---x---y---z---|');
      const expected = '-d-a-e-b-f-c---x---y---z---|';
      expectObservable(merge(e1, e2, e3, 2, rxTestScheduler)).toBe(expected);
    });
  });

  it('should use the scheduler even when one Observable is merged', (done) => {
    let e1Subscribed = false;
    const e1 = defer(() => {
      e1Subscribed = true;
      return of('a');
    });

    merge(e1, asyncScheduler).subscribe({
      error: done,
      complete: () => {
        expect(e1Subscribed).to.be.true;
        done();
      },
    });

    expect(e1Subscribed).to.be.false;
  });

  it('should deem a single array argument to be an ObservableInput', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const array = ['foo', 'bar'];
      const expected = '(fb|)';
      expectObservable(merge(array)).toBe(expected, { f: 'foo', b: 'bar' });
    });
  });
});
import { NEVER } from 'rxjs';
import { expect } from 'chai';
import { expectObservable } from '../helpers/marble-testing';

/** @test {NEVER} */
describe('NEVER', () => {
  it('should create a cold observable that never emits', () => {
    const expected = '-';
    const e1 = NEVER;
    expectObservable(e1).toBe(expected);
  });

  it('should return the same instance every time', () => {
    expect(NEVER).to.equal(NEVER);
  });
});
/** @prettier */
import { expect } from 'chai';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { concatMap, delay, concatAll } from 'rxjs/operators';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {of} */
describe('of', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should create a cold observable that emits 1, 2, 3', () => {
    rxTestScheduler.run(({ expectObservable, time }) => {
      const delayValue = time('--|');

      const e1 = of(1, 2, 3).pipe(
        // for the purpose of making a nice diagram, spread out the synchronous emissions
        concatMap((x, i) => of(x).pipe(delay(i === 0 ? 0 : delayValue)))
      );
      const expected = 'x-y-(z|)';
      expectObservable(e1).toBe(expected, { x: 1, y: 2, z: 3 });
    });
  });

  it('should create an observable from the provided values', (done) => {
    const x = { foo: 'bar' };
    const expected = [1, 'a', x];
    let i = 0;

    of(1, 'a', x).subscribe({
      next: (y: any) => {
        expect(y).to.equal(expected[i++]);
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  it('should emit one value', (done) => {
    let calls = 0;

    of(42).subscribe({
      next: (x: number) => {
        expect(++calls).to.equal(1);
        expect(x).to.equal(42);
      },
      error: (err: any) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  it('should handle an Observable as the only value', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = of(of('a', 'b', 'c'));
      const result = source.pipe(concatAll());
      expectObservable(result).toBe('(abc|)');
    });
  });

  it('should handle many Observable as the given values', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const source = of(of('a', 'b', 'c'), of('d', 'e', 'f'));

      const result = source.pipe(concatAll());
      expectObservable(result).toBe('(abcdef|)');
    });
  });
});
/** @prettier */
import { onErrorResumeNext, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { expect } from 'chai';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

describe('onErrorResumeNext', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should continue with observables', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const s1 = hot('  --a--b--#                     ');
      const s2 = cold('         --c--d--#             ');
      const s3 = cold('                 --e--#        ');
      const s4 = cold('                      --f--g--|');
      const subs1 = '   ^-------!                     ';
      const subs2 = '   --------^-------!             ';
      const subs3 = '   ----------------^----!        ';
      const subs4 = '   ---------------------^-------!';
      const expected = '--a--b----c--d----e----f--g--|';

      expectObservable(onErrorResumeNext(s1, s2, s3, s4)).toBe(expected);
      expectSubscriptions(s1.subscriptions).toBe(subs1);
      expectSubscriptions(s2.subscriptions).toBe(subs2);
      expectSubscriptions(s3.subscriptions).toBe(subs3);
      expectSubscriptions(s4.subscriptions).toBe(subs4);
    });
  });

  it('should continue array of observables', () => {
    rxTestScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const s1 = hot('  --a--b--#                     ');
      const s2 = cold('         --c--d--#             ');
      const s3 = cold('                 --e--#        ');
      const s4 = cold('                      --f--g--|');
      const subs1 = '   ^-------!                     ';
      const subs2 = '   --------^-------!             ';
      const subs3 = '   ----------------^----!        ';
      const subs4 = '   ---------------------^-------!';
      const expected = '--a--b----c--d----e----f--g--|';

      expectObservable(onErrorResumeNext([s1, s2, s3, s4])).toBe(expected);
      expectSubscriptions(s1.subscriptions).toBe(subs1);
      expectSubscriptions(s2.subscriptions).toBe(subs2);
      expectSubscriptions(s3.subscriptions).toBe(subs3);
      expectSubscriptions(s4.subscriptions).toBe(subs4);
    });
  });

  it('should complete single observable throws', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const source = hot('#   ');
      const subs = '      (^!)';
      const expected = '  |   ';

      expectObservable(onErrorResumeNext(source)).toBe(expected);
      expectSubscriptions(source.subscriptions).toBe(subs);
    });
  });

  it('should skip invalid sources and move on', () => {
    const results: any[] = [];

    onErrorResumeNext(of(1), [2, 3, 4], { notValid: 'LOL' } as any, of(5, 6)).subscribe({
      next: (value) => results.push(value),
      complete: () => results.push('complete'),
    });

    expect(results).to.deep.equal([1, 2, 3, 4, 5, 6, 'complete']);
  });

  it('should call finalize after each sync observable', () => {
    let results: any[] = [];

    onErrorResumeNext(
      of(1).pipe(finalize(() => results.push('finalize 1'))),
      of(2).pipe(finalize(() => results.push('finalize 2'))),
      of(3).pipe(finalize(() => results.push('finalize 3'))),
      of(4).pipe(finalize(() => results.push('finalize 4')))
    ).subscribe({
      next: (value) => results.push(value),
      complete: () => results.push('complete'),
    });

    expect(results).to.deep.equal([1, 'finalize 1', 2, 'finalize 2', 3, 'finalize 3', 4, 'finalize 4', 'complete']);
  });
});
/** @prettier */
import { expect } from 'chai';
import { TestScheduler } from 'rxjs/testing';
import { pairs } from 'rxjs';
import { observableMatcher } from '../helpers/observableMatcher';

describe('pairs', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should create an observable emits key-value pair', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = pairs({ a: 1, b: 2 });
      const expected = '(ab|)';
      const values = {
        a: ['a', 1],
        b: ['b', 2],
      };

      expectObservable(e1).toBe(expected, values);
    });
  });

  it('should create an observable without scheduler', (done) => {
    let expected = [
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ];

    pairs({ a: 1, b: 2, c: 3 }).subscribe({
      next: (x) => {
        expect(x).to.deep.equal(expected.shift());
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        expect(expected).to.be.empty;
        done();
      },
    });
  });

  it('should work with empty object', () => {
    rxTestScheduler.run(({ expectObservable }) => {
      const e1 = pairs({});
      const expected = '|';

      expectObservable(e1).toBe(expected);
    });
  });
});
/** @prettier */
import { expect } from 'chai';
import { Observable, partition, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {partition} */
describe('partition', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  function expectObservableArray(result: Observable<string>[], expected: string[]) {
    for (let idx = 0; idx < result.length; idx++) {
      rxTestScheduler.expectObservable(result[idx]).toBe(expected[idx]);
    }
  }

  it('should partition an observable of integers into even and odd', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --1-2---3------4--5---6--|');
      const e1subs = '   ^------------------------!';
      // prettier-ignore
      const expected = [
        '                --1-----3---------5------|',
        '                ----2----------4------6--|',
      ];

      const result = partition(e1, (x: any) => x % 2 === 1);

      expectObservableArray(result, expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition an observable into two using a predicate', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d--a---c--|');
      const e1subs = '   ^------------------------!';
      // prettier-ignore
      const expected = [
        '                --a-----a---------a------|',
        '                ----b----------d------c--|',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition an observable into two using a predicate that takes an index', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d--a---c--|');
      const e1subs = '   ^------------------------!';
      // prettier-ignore
      const expected = [
        '                --a-----a---------a------|',
        '                ----b----------d------c--|',
      ];

      function predicate(value: string, index: number) {
        return index % 2 === 0;
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition an observable into two using a predicate and thisArg', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d--a---c--|');
      const e1subs = '   ^------------------------!';
      // prettier-ignore
      const expected = [
        '                --a-----a---------a------|',
        '                ----b----------d------c--|',
      ];

      function predicate(this: any, x: string) {
        return x === this.value;
      }

      expectObservableArray(partition(e1, predicate, { value: 'a' }), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should pass errors to both returned observables', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b---#');
      const e1subs = '   ^-------!';
      // prettier-ignore
      const expected = [
        '                --a-----#',
        '                ----b---#',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should pass errors to both returned observables if source throws', () => {
    rxTestScheduler.run(({ cold, expectSubscriptions }) => {
      const e1 = cold('  #   ');
      const e1subs = '   (^!)';
      // prettier-ignore
      const expected = [
        '                 #  ',
        '                 #  ',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should pass errors to both returned observables if predicate throws', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b--a--|');
      const e1subs = '   ^------!   ';
      // prettier-ignore
      const expected = [
        '                --a----#   ',
        '                ----b--#   ',
      ];

      let index = 0;
      const error = 'error';
      function predicate(x: string) {
        const match = x === 'a';
        if (match && index++ > 1) {
          throw error;
        }
        return match;
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition empty observable if source does not emits', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   ----|');
      const e1subs = '   ^---!';
      // prettier-ignore
      const expected = [
        '                ----|',
        '                ----|',
      ];

      function predicate(x: string) {
        return x === 'x';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition empty observable if source is empty', () => {
    rxTestScheduler.run(({ cold, expectSubscriptions }) => {
      const e1 = cold('  |   ');
      const e1subs = '   (^!)';
      // prettier-ignore
      const expected = [
        '                |   ',
        '                |   ',
      ];

      function predicate(x: string) {
        return x === 'x';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition if source emits single elements', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a--|');
      const e1subs = '   ^----!';
      // prettier-ignore
      const expected = [
        '                --a--|',
        '                -----|',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition if predicate matches all of source elements', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a--a--a--a--a--a--a--|');
      const e1subs = '   ^----------------------!';
      // prettier-ignore
      const expected = [
        '                --a--a--a--a--a--a--a--|',
        '                -----------------------|',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition if predicate does not match all of source elements', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --b--b--b--b--b--b--b--|');
      const e1subs = '   ^----------------------!';
      // prettier-ignore
      const expected = [
        '                -----------------------|',
        '                --b--b--b--b--b--b--b--|',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition to infinite observable if source does not completes', () => {
    rxTestScheduler.run(({ hot, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d----');
      const e1subs = '   ^-------------------';
      // prettier-ignore
      const expected = [
        '                --a-----a-----------',
        '                ----b----------d----',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition to infinite observable if source never completes', () => {
    rxTestScheduler.run(({ cold, expectSubscriptions }) => {
      const e1 = cold('  -');
      const e1subs = '   ^';
      // prettier-ignore
      const expected = [
        '                -',
        '                -',
      ];

      function predicate(x: string) {
        return x === 'a';
      }

      expectObservableArray(partition(e1, predicate), expected);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should partition into two observable with early unsubscription', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d-|');
      const unsub = '    -------!          ';
      const e1subs = '   ^------!          ';
      // prettier-ignore
      const expected = [
        '                --a-----          ',
        '                ----b---          ',
      ];

      function predicate(x: string) {
        return x === 'a';
      }
      const result = partition(e1, predicate);

      for (let idx = 0; idx < result.length; idx++) {
        expectObservable(result[idx], unsub).toBe(expected[idx]);
      }
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should not break unsubscription chains when result is unsubscribed explicitly', () => {
    rxTestScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('   --a-b---a------d-|');
      const e1subs = '   ^------!          ';
      // prettier-ignore
      const expected = [
        '                --a-----          ',
        '                ----b---          ',
      ];
      const unsub = '    -------!          ';

      const e1Pipe = e1.pipe(mergeMap((x: string) => of(x)));
      const result = partition(e1Pipe, (x: string) => x === 'a');

      expectObservable(result[0], unsub).toBe(expected[0]);
      expectObservable(result[1], unsub).toBe(expected[1]);
      expectSubscriptions(e1.subscriptions).toBe([e1subs, e1subs]);
    });
  });

  it('should accept thisArg', () => {
    const thisArg = {};

    partition(
      of(1),
      function (this: any, value: number) {
        expect(this).to.deep.equal(thisArg);
        return true;
      },
      thisArg
    ).forEach((observable: Observable<number>) => observable.subscribe());
  });
});
import { hot, cold, expectObservable, expectSubscriptions } from '../helpers/marble-testing';
import { race, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { expect } from 'chai';

/** @test {race} */
describe('static race', () => {
  it('should race a single observable', () => {
    const e1 =  cold('---a-----b-----c----|');
    const e1subs =   '^                   !';
    const expected = '---a-----b-----c----|';

    const result = race(e1);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
  });

  it('should race cold and cold', () => {
    const e1 =  cold('---a-----b-----c----|');
    const e1subs =   '^                   !';
    const e2 =  cold('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----b-----c----|';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should race with array of observable', () => {
    const e1 =  cold('---a-----b-----c----|');
    const e1subs =   '^                   !';
    const e2 =  cold('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----b-----c----|';

    const result = race([e1, e2]);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should race hot and hot', () => {
    const e1 =   hot('---a-----b-----c----|');
    const e1subs =   '^                   !';
    const e2 =   hot('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----b-----c----|';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should race hot and cold', () => {
    const e1 =  cold('---a-----b-----c----|');
    const e1subs =   '^                   !';
    const e2 =   hot('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----b-----c----|';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should race 2nd and 1st', () => {
    const e1 =  cold('------x-----y-----z----|');
    const e1subs =   '^  !';
    const e2 =  cold('---a-----b-----c----|');
    const e2subs =   '^                   !';
    const expected = '---a-----b-----c----|';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should race emit and complete', () => {
    const e1 =  cold('-----|');
    const e1subs =   '^    !';
    const e2 =   hot('------x-----y-----z----|');
    const e2subs =   '^    !';
    const expected = '-----|';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should allow unsubscribing early and explicitly', () => {
    const e1 =  cold('---a-----b-----c----|');
    const e1subs =   '^           !';
    const e2 =   hot('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----b---';
    const unsub =    '            !';

    const result = race(e1, e2);

    expectObservable(result, unsub).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should not break unsubscription chains when unsubscribed explicitly', () => {
    const e1 =   hot('--a--^--b--c---d-| ');
    const e1subs =        '^        !    ';
    const e2 =   hot('---e-^---f--g---h-|');
    const e2subs =        '^  !    ';
    const expected =      '---b--c---    ';
    const unsub =         '         !    ';

    const result = race(
        e1.pipe(mergeMap((x: string) => of(x))),
        e2.pipe(mergeMap((x: string) => of(x)))
    ).pipe(mergeMap((x: any) => of(x)));

    expectObservable(result, unsub).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should never emit when given non emitting sources', () => {
    const e1 =  cold('---|');
    const e2 =  cold('---|');
    const e1subs =   '^  !';
    const expected = '---|';

    const source = race(e1, e2);

    expectObservable(source).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
  });

  it('should throw when error occurs mid stream', () => {
    const e1 =  cold('---a-----#');
    const e1subs =   '^        !';
    const e2 =  cold('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---a-----#';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('should throw when error occurs before a winner is found', () => {
    const e1 =  cold('---#');
    const e1subs =   '^  !';
    const e2 =  cold('------x-----y-----z----|');
    const e2subs =   '^  !';
    const expected = '---#';

    const result = race(e1, e2);

    expectObservable(result).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
  });

  it('handle empty', () => {
    const e1 =  cold('|');
    const e1subs =   '(^!)';
    const expected = '|';

    const source = race(e1);

    expectObservable(source).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
  });

  it('handle never', () => {
    const e1 =  cold('-');
    const e1subs =   '^';
    const expected = '-';

    const source = race(e1);

    expectObservable(source).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
  });

  it('handle throw', () => {
    const e1 =  cold('#');
    const e1subs =   '(^!)';
    const expected = '#';

    const source = race(e1);

    expectObservable(source).toBe(expected);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
  });

  it('should support a single ObservableInput argument', (done) => {
    const source = race(Promise.resolve(42));
    source.subscribe({ next: value => {
      expect(value).to.equal(42);
    }, error: done, complete: done });
  });
});
import { expect } from 'chai';
import * as sinon from 'sinon';
import { asapScheduler as asap, range, of} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { expectObservable } from '../helpers/marble-testing';
import { concatMap, delay } from 'rxjs/operators';

declare const rxTestScheduler: TestScheduler;

/** @test {range} */
describe('range', () => {
  it('should create an observable with numbers 1 to 10', () => {
    const e1 = range(1, 10)
      // for the purpose of making a nice diagram, spread out the synchronous emissions
      .pipe(concatMap((x, i) => of(x).pipe(delay(i === 0 ? 0 : 20, rxTestScheduler))));
    const expected = 'a-b-c-d-e-f-g-h-i-(j|)';
    const values = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7,
      h: 8,
      i: 9,
      j: 10,
    };
    expectObservable(e1).toBe(expected, values);
  });

  it('should work for two subscribers', () => {
    const e1 = range(1, 5)
      .pipe(concatMap((x, i) => of(x).pipe(delay(i === 0 ? 0 : 20, rxTestScheduler))));
    const expected = 'a-b-c-d-(e|)';
    const values = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5
    };
    expectObservable(e1).toBe(expected, values);
    expectObservable(e1).toBe(expected, values);
  });

  it('should synchronously create a range of values by default', () => {
    const results = [] as any[];
    range(12, 4).subscribe(function (x) {
      results.push(x);
    });
    expect(results).to.deep.equal([12, 13, 14, 15]);
  });

  it('should accept a scheduler', (done) => {
    const expected = [12, 13, 14, 15];
    sinon.spy(asap, 'schedule');

    const source = range(12, 4, asap);

    source.subscribe({ next: function (x) {
      expect(asap.schedule).have.been.called;
      const exp = expected.shift();
      expect(x).to.equal(exp);
    }, error: function (x) {
      done(new Error('should not be called'));
    }, complete: () => {
      (<any>asap.schedule).restore();
      done();
    } });

  });

  it('should accept only one argument where count is argument and start is zero', () => {
    const e1 = range(5)
      .pipe(concatMap((x, i) => of(x).pipe(delay(i === 0 ? 0 : 20, rxTestScheduler))));
    const expected = 'a-b-c-d-(e|)';
    const values = {
      a: 0,
      b: 1,
      c: 2,
      d: 3,
      e: 4
    };
    expectObservable(e1).toBe(expected, values);
    expectObservable(e1).toBe(expected, values);
  });

  it('should return empty for range(0)', () => {
    const results: any[] = [];
    range(0).subscribe({
      next: value => results.push(value),
      complete: () => results.push('done')
    })
    expect(results).to.deep.equal(['done'])
  });

  it('should return empty for range with a negative count', () => {
    const results: any[] = [];
    range(5, -5).subscribe({
      next: value => results.push(value),
      complete: () => results.push('done')
    })
    expect(results).to.deep.equal(['done'])
  });
});/** @prettier */
import { expect } from 'chai';
import { TestScheduler } from 'rxjs/testing';
import { throwError } from 'rxjs';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {throwError} */
describe('throwError', () => {
  let rxTest: TestScheduler;

  beforeEach(() => {
    rxTest = new TestScheduler(observableMatcher);
  });

  it('should create a cold observable that just emits an error', () => {
    rxTest.run(({ expectObservable }) => {
      const expected = '#';
      const e1 = throwError(() => 'error');
      expectObservable(e1).toBe(expected);
    });
  });

  it('should emit one value', (done) => {
    let calls = 0;
    throwError(() => 'bad').subscribe({
      next: () => {
        done(new Error('should not be called'));
      },
      error: (err) => {
        expect(++calls).to.equal(1);
        expect(err).to.equal('bad');
        done();
      },
    });
  });

  it('should accept scheduler', () => {
    rxTest.run(({ expectObservable }) => {
      const e = throwError('error', rxTest);

      expectObservable(e).toBe('#');
    });
  });

  it('should accept a factory function', () => {
    let calls = 0;
    let errors: any[] = [];

    const source = throwError(() => ({
      call: ++calls,
      message: 'LOL',
    }));

    source.subscribe({
      next: () => {
        throw new Error('this should not happen');
      },
      error: (err) => {
        errors.push(err);
      },
    });

    source.subscribe({
      next: () => {
        throw new Error('this should not happen');
      },
      error: (err) => {
        errors.push(err);
      },
    });

    expect(errors).to.deep.equal([
      {
        call: 1,
        message: 'LOL',
      },
      {
        call: 2,
        message: 'LOL',
      },
    ]);
  });
});
import { timer, NEVER, merge } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { mergeMap, take, concat } from 'rxjs/operators';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {timer} */
describe('timer', () => {
  let rxTest: TestScheduler;

  beforeEach(() => {
    rxTest = new TestScheduler(observableMatcher);
  });

  it('should create an observable emitting periodically', () => {
    rxTest.run(({ expectObservable }) => {
      const e1 = timer(6, 2, rxTest).pipe(
        take(4), // make it actually finite, so it can be rendered
        concat(NEVER) // but pretend it's infinite by not completing
      );
      const expected = '------a-b-c-d-';
      const values = {
        a: 0,
        b: 1,
        c: 2,
        d: 3,
      };
      expectObservable(e1).toBe(expected, values);
    });
  });

  it('should schedule a value of 0 then complete', () => {
    rxTest.run(({ expectObservable }) => {
      const dueTime = 5; // -----|
      const expected = '    -----(x|)';

      const source = timer(dueTime, undefined, rxTest);
      expectObservable(source).toBe(expected, { x: 0 });
    });
  });

  it('should emit a single value immediately', () => {
    rxTest.run(({ expectObservable }) => {
      const dueTime = 0;
      const expected = '(x|)';

      const source = timer(dueTime, rxTest);
      expectObservable(source).toBe(expected, { x: 0 });
    });
  });

  it('should start after delay and periodically emit values', () => {
    rxTest.run(({ expectObservable }) => {
      const dueTime = 4; // ----|
      const period = 2; //       -|-|-|-|
      const expected = '    ----a-b-c-d-(e|)';

      const source = timer(dueTime, period, rxTest).pipe(take(5));
      const values = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      expectObservable(source).toBe(expected, values);
    });
  });

  it('should start immediately and periodically emit values', () => {
    rxTest.run(({ expectObservable }) => {
      const dueTime = 0; //|
      const period = 3; //  --|--|--|--|
      const expected = '   a--b--c--d--(e|)';

      const source = timer(dueTime, period, rxTest).pipe(take(5));
      const values = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      expectObservable(source).toBe(expected, values);
    });
  });

  it('should stop emiting values when subscription is done', () => {
    rxTest.run(({ expectObservable }) => {
      const dueTime = 0; //|
      const period = 3; //  --|--|--|--|
      const expected = '   a--b--c--d--e';
      const unsub = '      ^------------!';

      const source = timer(dueTime, period, rxTest);
      const values = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      expectObservable(source, unsub).toBe(expected, values);
    });
  });

  it('should schedule a value at a specified Date', () => {
    rxTest.run(({ expectObservable }) => {
      const offset = 4; // ----|
      const expected = '   ----(a|)';

      const dueTime = new Date(rxTest.now() + offset);
      const source = timer(dueTime, undefined, rxTest);
      expectObservable(source).toBe(expected, { a: 0 });
    });
  });

  it('should start after delay and periodically emit values', () => {
    rxTest.run(({ expectObservable }) => {
      const offset = 4; // ----|
      const period = 2; //      -|-|-|-|
      const expected = '   ----a-b-c-d-(e|)';

      const dueTime = new Date(rxTest.now() + offset);
      const source = timer(dueTime, period, rxTest).pipe(take(5));
      const values = { a: 0, b: 1, c: 2, d: 3, e: 4 };
      expectObservable(source).toBe(expected, values);
    });
  });

  it('should still target the same date if a date is provided even for the ' + 'second subscription', () => {
    rxTest.run(({ cold, time, expectObservable }) => {
      const offset = time('----|    ');
      const t1 = cold('    a|       ');
      const t2 = cold('    --a|     ');
      const expected = '   ----(aa|)';

      const dueTime = new Date(rxTest.now() + offset);
      const source = timer(dueTime, undefined, rxTest);

      const testSource = merge(t1, t2).pipe(mergeMap(() => source));

      expectObservable(testSource).toBe(expected, { a: 0 });
    });
  });

  it('should accept Infinity as the first argument', () => {
    rxTest.run(({ expectObservable }) => {
      const source = timer(Infinity, undefined, rxTest);
      const expected = '------';
      expectObservable(source).toBe(expected);
    });
  });

  it('should accept Infinity as the second argument', () => {
    rxTest.run(({ expectObservable }) => {
      rxTest.maxFrames = 20;
      const source = timer(4, Infinity, rxTest);
      const expected = '----a-';
      expectObservable(source).toBe(expected, { a: 0 });
    });
  });

  it('should accept negative numbers as the second argument, which should cause immediate completion', () => {
    rxTest.run(({ expectObservable }) => {
      const source = timer(4, -4, rxTest);
      const expected = '----(a|)';
      expectObservable(source).toBe(expected, { a: 0 });
    });
  });

  it('should accept 0 as the second argument', () => {
    rxTest.run(({ expectObservable }) => {
      const source = timer(4, 0, rxTest).pipe(take(5));
      const expected = '----(abcde|)';
      expectObservable(source).toBe(expected, { a: 0, b: 1, c: 2, d: 3, e: 4 });
    });
  });

  it('should emit after a delay of 0 for Date objects in the past', () => {
    rxTest.run(({ expectObservable }) => {
      const expected = '(a|)';
      const threeSecondsInThePast = new Date(rxTest.now() - 3000);
      const source = timer(threeSecondsInThePast, undefined, rxTest);
      expectObservable(source).toBe(expected, { a: 0 });
    });
  });
});
import { expect } from 'chai';
import { using, range, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

describe('using', () => {
  it('should dispose of the resource when the subscription is disposed', (done) => {
    let disposed = false;
    const source = using(
      () => new Subscription(() => disposed = true),
      (resource) => range(0, 3)
    )
    .pipe(take(2));

    source.subscribe();

    if (disposed) {
      done();
    } else {
      done(new Error('disposed should be true but was false'));
    }
  });

  it('should accept factory returns promise resolves', (done) => {
    const expected = 42;

    let disposed = false;
    const e1 = using(
      () => new Subscription(() => disposed = true),
      (resource) => new Promise((resolve: any) => { resolve(expected); }));

    e1.subscribe({ next: x => {
      expect(x).to.equal(expected);
    }, error: (x) => {
      done(new Error('should not be called'));
    }, complete: () => {
      done();
    } });
  });

  it('should accept factory returns promise rejects', (done) => {
    const expected = 42;

    let disposed = false;
    const e1 = using(
      () => new Subscription(() => disposed = true),
      (resource) => new Promise((resolve: any, reject: any) => { reject(expected); }));

    e1.subscribe({ next: x => {
      done(new Error('should not be called'));
    }, error: (x) => {
      expect(x).to.equal(expected);
      done();
    }, complete: () => {
      done(new Error('should not be called'));
    } });
  });

  it('should raise error when resource factory throws', (done) => {
    const expectedError = 'expected';
    const error = 'error';

    const source = using(
      () => {
        throw expectedError;
      },
      (resource) => {
        throw error;
      }
    );

    source.subscribe({ next: (x) => {
      done(new Error('should not be called'));
    }, error: (x) => {
      expect(x).to.equal(expectedError);
      done();
    }, complete: () => {
      done(new Error('should not be called'));
    } });
  });

  it('should raise error when observable factory throws', (done) => {
    const error = 'error';
    let disposed = false;

    const source = using(
      () => new Subscription(() => disposed = true),
      (resource) => {
        throw error;
      }
    );

    source.subscribe({ next: (x) => {
      done(new Error('should not be called'));
    }, error: (x) => {
      expect(x).to.equal(error);
      done();
    }, complete: () => {
      done(new Error('should not be called'));
    } });
  });
});
import { expect } from 'chai';
import { hot, cold, expectObservable, expectSubscriptions } from '../helpers/marble-testing';
import { queueScheduler as rxQueueScheduler, zip, from, of } from 'rxjs';

const queueScheduler = rxQueueScheduler;

/** @test {zip} */
describe('static zip', () => {
  it('should combine a source with a second', () => {
    const a =    hot('---1---2---3---');
    const asubs =    '^';
    const b =    hot('--4--5--6--7--8--');
    const bsubs =    '^';
    const expected = '---x---y---z';

    expectObservable(zip(a, b))
      .toBe(expected, { x: ['1', '4'], y: ['2', '5'], z: ['3', '6'] });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should zip the provided observables', (done) => {
    const expected = ['a1', 'b2', 'c3'];
    let i = 0;

    zip(
      from(['a', 'b', 'c']),
      from([1, 2, 3]), (a: string, b: number) => a + b)
        .subscribe({ next: (x: string) => {
          expect(x).to.equal(expected[i++]);
        }, complete: done });
  });

  it('should end once one observable completes and its buffer is empty', () => {
    const e1 =   hot('---a--b--c--|               ');
    const e1subs =   '^           !               ';
    const e2 =   hot('------d----e----f--------|  ');
    const e2subs =   '^                 !         ';
    const e3 =   hot('--------h----i----j---------'); // doesn't complete
    const e3subs =   '^                 !         ';
    const expected = '--------x----y----(z|)      '; // e1 complete and buffer empty
    const values = {
      x: ['a', 'd', 'h'],
      y: ['b', 'e', 'i'],
      z: ['c', 'f', 'j']
    };

    expectObservable(zip(e1, e2, e3)).toBe(expected, values);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
    expectSubscriptions(e3.subscriptions).toBe(e3subs);
  });

  it('should end once one observable nexts and zips value from completed other ' +
  'observable whose buffer is empty', () => {
    const e1 =   hot('---a--b--c--|             ');
    const e1subs =   '^           !             ';
    const e2 =   hot('------d----e----f|        ');
    const e2subs =   '^                !        ';
    const e3 =   hot('--------h----i----j-------'); // doesn't complete
    const e3subs =   '^                 !       ';
    const expected = '--------x----y----(z|)    '; // e2 buffer empty and signaled complete
    const values = {
      x: ['a', 'd', 'h'],
      y: ['b', 'e', 'i'],
      z: ['c', 'f', 'j']
    };

    expectObservable(zip(e1, e2, e3)).toBe(expected, values);
    expectSubscriptions(e1.subscriptions).toBe(e1subs);
    expectSubscriptions(e2.subscriptions).toBe(e2subs);
    expectSubscriptions(e3.subscriptions).toBe(e3subs);
  });

  describe('with iterables', () => {
    it('should zip them with values', () => {
      const myIterator = (function *() {
        for (let i = 0; i < 4; i++) {
          yield i;
        }
      })();

      const e1 =   hot('---a---b---c---d---|');
      const e1subs =   '^              !';
      const expected = '---w---x---y---(z|)';

      const values = {
        w: ['a', 0],
        x: ['b', 1],
        y: ['c', 2],
        z: ['d', 3]
      };

      expectObservable(zip(e1, myIterator)).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });

    it('should work with empty observable and empty iterable', () => {
      const a = cold('|');
      const asubs = '(^!)';
      const b: number[] = [];
      const expected = '|';

      expectObservable(zip(a, b)).toBe(expected);
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with empty observable and non-empty iterable', () => {
      const a = cold('|');
      const asubs = '(^!)';
      const b = [1];
      const expected = '|';

      expectObservable(zip(a, b)).toBe(expected);
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should complete instantly if given an empty iterable', () => {
      const a = hot('---^----a--|');
      const asubs =    '(^!)';
      const b: number[] = [];
      const expected = '|';

      expectObservable(zip(a, b)).toBe(expected);
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with never observable and non-empty iterable', () => {
      const a = cold('-');
      const asubs = '^';
      const b = [1];
      const expected = '-';

      expectObservable(zip(a, b)).toBe(expected);
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with non-empty observable and non-empty iterable', () => {
      const a = hot('---^----1--|');
      const asubs =    '^    !   ';
      const b = [2];
      const expected = '-----(x|)';

      expectObservable(zip(a, b)).toBe(expected, { x: ['1', 2] });
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with observable which raises error and non-empty iterable', () => {
      const a = hot('---^----#');
      const asubs =    '^    !';
      const b = [1];
      const expected = '-----#';

      expectObservable(zip(a, b)).toBe(expected);
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with non-empty many observable and non-empty many iterable', () => {
      const a = hot('---^--1--2--3--|');
      const asubs =    '^        !   ';
      const b = [4, 5, 6];
      const expected = '---x--y--(z|)';

      expectObservable(zip(a, b)).toBe(expected,
        { x: ['1', 4], y: ['2', 5], z: ['3', 6] });
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });

    it('should work with non-empty observable and non-empty iterable selector that throws', () => {
      const a = hot('---^--1--2--3--|');
      const asubs =    '^     !';
      const b = [4, 5, 6];
      const expected = '---x--#';

      const selector = (x: string, y: number) => {
        if (y === 5) {
          throw new Error('too bad');
        } else {
          return x + y;
        }};
      expectObservable(zip(a, b, selector)).toBe(expected,
        { x: '14' }, new Error('too bad'));
      expectSubscriptions(a.subscriptions).toBe(asubs);
    });
  });

  it('should combine two observables and selector', () => {
    const a =    hot('---1---2---3---');
    const asubs =    '^';
    const b =    hot('--4--5--6--7--8--');
    const bsubs =    '^';
    const expected = '---x---y---z';

    expectObservable(zip(a, b, (e1: string, e2: string) => e1 + e2))
      .toBe(expected, { x: '14', y: '25', z: '36' });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with n-ary symmetric', () => {
    const a = hot('---1-^-1----4----|');
    const asubs =      '^         !  ';
    const b = hot('---1-^--2--5----| ');
    const bsubs =      '^         !  ';
    const c = hot('---1-^---3---6-|  ');
    const expected =   '----x---y-|  ';

    expectObservable(zip(a, b, c)).toBe(expected,
      { x: ['1', '2', '3'], y: ['4', '5', '6'] });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with n-ary symmetric selector', () => {
    const a = hot('---1-^-1----4----|');
    const asubs =      '^         !  ';
    const b = hot('---1-^--2--5----| ');
    const bsubs =      '^         !  ';
    const c = hot('---1-^---3---6-|  ');
    const expected =   '----x---y-|  ';

    const observable = zip(a, b, c,
      (r0: string, r1: string, r2: string) => [r0, r1, r2]);
    expectObservable(observable).toBe(expected,
      { x: ['1', '2', '3'], y: ['4', '5', '6'] });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with n-ary symmetric array selector', () => {
    const a = hot('---1-^-1----4----|');
    const asubs =      '^         !  ';
    const b = hot('---1-^--2--5----| ');
    const bsubs =      '^         !  ';
    const c = hot('---1-^---3---6-|  ');
    const expected =   '----x---y-|  ';

    const observable = zip(a, b, c,
      (r0: string, r1: string, r2: string) => [r0, r1, r2]);
    expectObservable(observable).toBe(expected,
      { x: ['1', '2', '3'], y: ['4', '5', '6'] });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with some data asymmetric 1', () => {
    const a = hot('---1-^-1-3-5-7-9-x-y-z-w-u-|');
    const asubs =      '^                 !    ';
    const b = hot('---1-^--2--4--6--8--0--|    ');
    const bsubs =      '^                 !    ';
    const expected =   '---a--b--c--d--e--|    ';

    expectObservable(zip(a, b, (r1: string, r2: string) => r1 + r2))
      .toBe(expected, { a: '12', b: '34', c: '56', d: '78', e: '90' });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with some data asymmetric 2', () => {
    const a = hot('---1-^--2--4--6--8--0--|    ');
    const asubs =      '^                 !    ';
    const b = hot('---1-^-1-3-5-7-9-x-y-z-w-u-|');
    const bsubs =      '^                 !    ';
    const expected =   '---a--b--c--d--e--|    ';

    expectObservable(zip(a, b, (r1: string, r2: string) => r1 + r2))
      .toBe(expected, { a: '21', b: '43', c: '65', d: '87', e: '09' });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with some data symmetric', () => {
    const a = hot('---1-^-1-3-5-7-9------| ');
    const asubs =      '^                ! ';
    const b = hot('---1-^--2--4--6--8--0--|');
    const bsubs =      '^                ! ';
    const expected =   '---a--b--c--d--e-| ';

    expectObservable(zip(a, b, (r1: string, r2: string) => r1 + r2))
      .toBe(expected, { a: '12', b: '34', c: '56', d: '78', e: '90' });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with selector throws', () => {
    const a = hot('---1-^-2---4----|  ');
    const asubs =      '^       !     ';
    const b = hot('---1-^--3----5----|');
    const bsubs =      '^       !     ';
    const expected =   '---x----#     ';

    const selector = (x: string, y: string) => {
      if (y === '5') {
        throw new Error('too bad');
      } else {
        return x + y;
      }};
    const observable = zip(a, b, selector);
    expectObservable(observable).toBe(expected,
      { x: '23' }, new Error('too bad'));
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with right completes first', () => {
    const a = hot('---1-^-2-----|');
    const asubs =      '^     !';
    const b = hot('---1-^--3--|');
    const bsubs =      '^     !';
    const expected =   '---x--|';

    expectObservable(zip(a, b)).toBe(expected, { x: ['2', '3'] });
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with two nevers', () => {
    const a = cold(  '-');
    const asubs =    '^';
    const b = cold(  '-');
    const bsubs =    '^';
    const expected = '-';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with never and empty', () => {
    const a = cold(  '-');
    const asubs =    '(^!)';
    const b = cold(  '|');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with empty and never', () => {
    const a = cold(  '|');
    const asubs =    '(^!)';
    const b = cold(  '-');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with empty and empty', () => {
    const a = cold(  '|');
    const asubs =    '(^!)';
    const b = cold(  '|');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with empty and non-empty', () => {
    const a = cold(  '|');
    const asubs =    '(^!)';
    const b = hot(   '---1--|');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with non-empty and empty', () => {
    const a = hot(   '---1--|');
    const asubs =    '(^!)';
    const b = cold(  '|');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with never and non-empty', () => {
    const a = cold(  '-');
    const asubs =    '^';
    const b = hot(   '---1--|');
    const bsubs =    '^     !';
    const expected = '-';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with non-empty and never', () => {
    const a = hot(   '---1--|');
    const asubs =    '^     !';
    const b = cold(  '-');
    const bsubs =    '^';
    const expected = '-';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with empty and error', () => {
    const a = cold(  '|');
    const asubs =    '(^!)';
    const b = hot(   '------#', undefined, 'too bad');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with error and empty', () => {
    const a = hot(   '------#', undefined, 'too bad');
    const asubs =    '(^!)';
    const b = cold(  '|');
    const bsubs =    '(^!)';
    const expected = '|';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with error', () => {
    const a =    hot('----------|');
    const asubs =    '^     !    ';
    const b =    hot('------#    ');
    const bsubs =    '^     !    ';
    const expected = '------#    ';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with never and error', () => {
    const a = cold(  '-');
    const asubs =    '^     !';
    const b =    hot('------#');
    const bsubs =    '^     !';
    const expected = '------#';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with error and never', () => {
    const a =    hot('------#');
    const asubs =    '^     !';
    const b = cold(  '-');
    const bsubs =    '^     !';
    const expected = '------#';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with error and error', () => {
    const a =    hot('------#', undefined, 'too bad');
    const asubs =    '^     !';
    const b =    hot('----------#', undefined, 'too bad 2');
    const bsubs =    '^     !';
    const expected = '------#';

    expectObservable(zip(a, b)).toBe(expected, null, 'too bad');
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with two sources that eventually raise errors', () => {
    const a =    hot('--w-----#----', { w: 1 }, 'too bad');
    const asubs =    '^       !';
    const b =    hot('-----z-----#-', { z: 2 }, 'too bad 2');
    const bsubs =    '^       !';
    const expected = '-----x--#';

    expectObservable(zip(a, b)).toBe(expected, { x: [1, 2] }, 'too bad');
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with two sources that eventually raise errors (swapped)', () => {
    const a =    hot('-----z-----#-', { z: 2 }, 'too bad 2');
    const asubs =    '^       !';
    const b =    hot('--w-----#----', { w: 1 }, 'too bad');
    const bsubs =    '^       !';
    const expected = '-----x--#';

    expectObservable(zip(a, b)).toBe(expected, { x: [2, 1] }, 'too bad');
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should work with error and some', () => {
    const a = cold(  '#');
    const asubs =    '(^!)';
    const b = hot(   '--1--2--3--');
    const bsubs =    '(^!)';
    const expected = '#';

    expectObservable(zip(a, b)).toBe(expected);
    expectSubscriptions(a.subscriptions).toBe(asubs);
    expectSubscriptions(b.subscriptions).toBe(bsubs);
  });

  it('should combine an immediately-scheduled source with an immediately-scheduled second', (done) => {
    const a = of(1, 2, 3, queueScheduler);
    const b = of(4, 5, 6, 7, 8, queueScheduler);
    const r = [[1, 4], [2, 5], [3, 6]];
    let i = 0;

    zip(a, b).subscribe({ next: (vals: Array<number>) => {
      expect(vals).to.deep.equal(r[i++]);
    }, complete: done });
  });

  it('should be able to zip all iterables', () => {
    const results: any[] = [];
    zip('abc', '123', 'xyz').subscribe({
      next: value => results.push(value),
      complete: () => results.push('complete')
    });
    expect(results).to.deep.equal([
      ['a','1','x'],
      ['b','2','y'],
      ['c','3','z'],
      'complete'
    ]);
  });

  it('should return EMPTY if passed an empty array as the only argument', () => {
    const results: string[] = [];
    zip([]).subscribe({
      next: () => {
        throw new Error('should not emit')
      },
      complete: () => {
        results.push('done');
      }
    });

    expect(results).to.deep.equal(['done']);
  });
});
