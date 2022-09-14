import { expect } from 'chai';
import { AsyncSubject, Observer } from 'rxjs';

class TestObserver implements Observer<number> {
  results: (number | string)[] = [];

  next(value: number): void {
    this.results.push(value);
  }

  error(err: any): void {
    this.results.push(err);
  }

  complete(): void {
    this.results.push('done');
  }
}

/** @test {AsyncSubject} */
describe('AsyncSubject', () => {
  it('should emit the last value when complete', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);
    subject.next(2);
    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal([2, 'done']);
  });

  it('should emit the last value when subscribing after complete', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();

    subject.next(1);
    subject.next(2);
    subject.complete();

    subject.subscribe(observer);
    expect(observer.results).to.deep.equal([2, 'done']);
  });

  it('should keep emitting the last value to subsequent subscriptions', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const subscription = subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);
    subject.next(2);
    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal([2, 'done']);

    subscription.unsubscribe();

    observer.results = [];
    subject.subscribe(observer);
    expect(observer.results).to.deep.equal([2, 'done']);
  });

  it('should not emit values after complete', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();

    subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);
    subject.next(2);
    expect(observer.results).to.deep.equal([]);
    subject.complete();
    subject.next(3);
    expect(observer.results).to.deep.equal([2, 'done']);
  });

  it('should not allow change value after complete', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const otherObserver = new TestObserver();
    subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal([1, 'done']);
    subject.next(2);
    subject.subscribe(otherObserver);
    expect(otherObserver.results).to.deep.equal([1, 'done']);
  });

  it('should not emit values if unsubscribed before complete', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const subscription = subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);
    subject.next(2);
    expect(observer.results).to.deep.equal([]);

    subscription.unsubscribe();

    subject.next(3);
    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal([]);
  });

  it('should just complete if no value has been nexted into it', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    subject.subscribe(observer);

    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal(['done']);
  });

  it('should keep emitting complete to subsequent subscriptions', () => {
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const subscription = subject.subscribe(observer);

    expect(observer.results).to.deep.equal([]);
    subject.complete();
    expect(observer.results).to.deep.equal(['done']);

    subscription.unsubscribe();
    observer.results = [];

    subject.error(new Error(''));

    subject.subscribe(observer);
    expect(observer.results).to.deep.equal(['done']);
  });

  it('should only error if an error is passed into it', () => {
    const expected = new Error('bad');
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);

    subject.error(expected);
    expect(observer.results).to.deep.equal([expected]);
  });

  it('should keep emitting error to subsequent subscriptions', () => {
    const expected = new Error('bad');
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const subscription = subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);

    subject.error(expected);
    expect(observer.results).to.deep.equal([expected]);

    subscription.unsubscribe();

    observer.results = [];
    subject.subscribe(observer);
    expect(observer.results).to.deep.equal([expected]);
  });

  it('should not allow send complete after error', () => {
    const expected = new Error('bad');
    const subject = new AsyncSubject<number>();
    const observer = new TestObserver();
    const subscription = subject.subscribe(observer);

    subject.next(1);
    expect(observer.results).to.deep.equal([]);

    subject.error(expected);
    expect(observer.results).to.deep.equal([expected]);

    subscription.unsubscribe();

    observer.results = [];

    subject.complete();
    subject.subscribe(observer);
    expect(observer.results).to.deep.equal([expected]);
  });

  it('should not be reentrant via complete', () => {
    const subject = new AsyncSubject<number>();
    let calls = 0;
    subject.subscribe({
      next: (value) => {
        calls++;
        if (calls < 2) {
          // if this is more than 1, we're reentrant, and that's bad.
          subject.complete();
        }
      },
    });

    subject.next(1);
    subject.complete();

    expect(calls).to.equal(1);
  });

  it('should not be reentrant via next', () => {
    const subject = new AsyncSubject<number>();
    let calls = 0;
    subject.subscribe({
      next: (value) => {
        calls++;
        if (calls < 2) {
          // if this is more than 1, we're reentrant, and that's bad.
          subject.next(value + 1);
        }
      },
    });

    subject.next(1);
    subject.complete();

    expect(calls).to.equal(1);
  });

  it('should allow reentrant subscriptions', () => {
    const subject = new AsyncSubject<number>();
    let results: any[] = [];

    subject.subscribe({
      next: (value) => {
        subject.subscribe({
          next: (value) => results.push('inner: ' + (value + value)),
          complete: () => results.push('inner: done'),
        });
        results.push('outer: ' + value);
      },
      complete: () => results.push('outer: done'),
    });

    subject.next(1);
    expect(results).to.deep.equal([]);
    subject.complete();
    expect(results).to.deep.equal(['inner: 2', 'inner: done', 'outer: 1', 'outer: done']);
  });
});
import { expect } from 'chai';
import { BehaviorSubject, Subject, ObjectUnsubscribedError, of } from 'rxjs';
import { tap, mergeMapTo } from 'rxjs/operators';
import { asInteropSubject } from '../helpers/interop-helper';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {BehaviorSubject} */
describe('BehaviorSubject', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler(observableMatcher);
  });

  it('should extend Subject', () => {
    const subject = new BehaviorSubject(null);
    expect(subject).to.be.instanceof(Subject);
  });

  it('should throw if it has received an error and getValue() is called', () => {
    const subject = new BehaviorSubject(null);
    subject.error(new Error('derp'));
    expect(() => {
      subject.getValue();
    }).to.throw(Error, 'derp');
  });

  it('should throw an ObjectUnsubscribedError if getValue() is called and the BehaviorSubject has been unsubscribed', () => {
    const subject = new BehaviorSubject('hi there');
    subject.unsubscribe();
    expect(() => {
      subject.getValue();
    }).to.throw(ObjectUnsubscribedError);
  });

  it('should have a getValue() method to retrieve the current value', () => {
    const subject = new BehaviorSubject('staltz');
    expect(subject.getValue()).to.equal('staltz');

    subject.next('oj');

    expect(subject.getValue()).to.equal('oj');
  });

  it('should not allow you to set `value` directly', () => {
    const subject = new BehaviorSubject('flibberty');

    try {
      // XXX: escape from readonly restriction for testing.
      (subject as any).value = 'jibbets';
    } catch (e) {
      //noop
    }

    expect(subject.getValue()).to.equal('flibberty');
    expect(subject.value).to.equal('flibberty');
  });

  it('should still allow you to retrieve the value from the value property', () => {
    const subject = new BehaviorSubject('fuzzy');
    expect(subject.value).to.equal('fuzzy');
    subject.next('bunny');
    expect(subject.value).to.equal('bunny');
  });

  it('should start with an initialization value', (done) => {
    const subject = new BehaviorSubject('foo');
    const expected = ['foo', 'bar'];
    let i = 0;

    subject.subscribe({
      next: (x: string) => {
        expect(x).to.equal(expected[i++]);
      },
      complete: done,
    });

    subject.next('bar');
    subject.complete();
  });

  it('should pump values to multiple subscribers', (done) => {
    const subject = new BehaviorSubject('init');
    const expected = ['init', 'foo', 'bar'];
    let i = 0;
    let j = 0;

    subject.subscribe((x: string) => {
      expect(x).to.equal(expected[i++]);
    });

    subject.subscribe({
      next: (x: string) => {
        expect(x).to.equal(expected[j++]);
      },
      complete: done,
    });

    expect(subject.observers.length).to.equal(2);
    subject.next('foo');
    subject.next('bar');
    subject.complete();
  });

  it('should not pass values nexted after a complete', () => {
    const subject = new BehaviorSubject('init');
    const results: string[] = [];

    subject.subscribe((x: string) => {
      results.push(x);
    });
    expect(results).to.deep.equal(['init']);

    subject.next('foo');
    expect(results).to.deep.equal(['init', 'foo']);

    subject.complete();
    expect(results).to.deep.equal(['init', 'foo']);

    subject.next('bar');
    expect(results).to.deep.equal(['init', 'foo']);
  });

  it('should clean out unsubscribed subscribers', (done) => {
    const subject = new BehaviorSubject('init');

    const sub1 = subject.subscribe((x: string) => {
      expect(x).to.equal('init');
    });

    const sub2 = subject.subscribe((x: string) => {
      expect(x).to.equal('init');
    });

    expect(subject.observers.length).to.equal(2);
    sub1.unsubscribe();
    expect(subject.observers.length).to.equal(1);
    sub2.unsubscribe();
    expect(subject.observers.length).to.equal(0);
    done();
  });

  it('should replay the previous value when subscribed', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const behaviorSubject = new BehaviorSubject('0');
      function feedNextIntoSubject(x: string) {
        behaviorSubject.next(x);
      }
      function feedErrorIntoSubject(err: any) {
        behaviorSubject.error(err);
      }
      function feedCompleteIntoSubject() {
        behaviorSubject.complete();
      }

      const sourceTemplate = ' -1-2-3----4------5-6---7--8----9--|';
      const subscriber1 = hot('------(a|)                         ').pipe(mergeMapTo(behaviorSubject));
      const unsub1 = '         ---------------------!             ';
      const expected1 = '      ------3---4------5-6--             ';
      const subscriber2 = hot('------------(b|)                   ').pipe(mergeMapTo(behaviorSubject));
      const unsub2 = '         -------------------------!         ';
      const expected2 = '      ------------4----5-6---7--         ';
      const subscriber3 = hot('---------------------------(c|)    ').pipe(mergeMapTo(behaviorSubject));
      const expected3 = '      ---------------------------8---9--|';

      expectObservable(
        hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
      ).toBe(sourceTemplate);
      expectObservable(subscriber1, unsub1).toBe(expected1);
      expectObservable(subscriber2, unsub2).toBe(expected2);
      expectObservable(subscriber3).toBe(expected3);
    });
  });

  it('should emit complete when subscribed after completed', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      const behaviorSubject = new BehaviorSubject('0');
      function feedNextIntoSubject(x: string) {
        behaviorSubject.next(x);
      }
      function feedErrorIntoSubject(err: any) {
        behaviorSubject.error(err);
      }
      function feedCompleteIntoSubject() {
        behaviorSubject.complete();
      }

      const sourceTemplate = ' -1-2-3--4--|       ';
      const subscriber1 = hot('---------------(a|)').pipe(mergeMapTo(behaviorSubject));
      const expected1 = '      ---------------|   ';

      expectObservable(
        hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
      ).toBe(sourceTemplate);
      expectObservable(subscriber1).toBe(expected1);
    });
  });

  it('should be an Observer which can be given to Observable.subscribe', (done) => {
    const source = of(1, 2, 3, 4, 5);
    const subject = new BehaviorSubject(0);
    const expected = [0, 1, 2, 3, 4, 5];

    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expected.shift());
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        expect(subject.value).to.equal(5);
        done();
      },
    });

    source.subscribe(subject);
  });

  it('should be an Observer which can be given to an interop source', (done) => {
    // This test reproduces a bug reported in this issue:
    // https://github.com/ReactiveX/rxjs/issues/5105
    // However, it cannot easily be fixed. See this comment:
    // https://github.com/ReactiveX/rxjs/issues/5105#issuecomment-578405446
    const source = of(1, 2, 3, 4, 5);
    const subject = new BehaviorSubject(0);
    const expected = [0, 1, 2, 3, 4, 5];

    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expected.shift());
      },
      error: (x) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        expect(subject.value).to.equal(5);
        done();
      },
    });

    source.subscribe(asInteropSubject(subject));
  });
});
import { expect } from 'chai';
import { ReplaySubject, Subject, of } from 'rxjs';
import { mergeMapTo, tap } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { observableMatcher } from '../helpers/observableMatcher';

/** @test {ReplaySubject} */
describe('ReplaySubject', () => {
  let rxTestScheduler: TestScheduler;

  beforeEach(() => {
    rxTestScheduler = new TestScheduler(observableMatcher);
  });

  it('should extend Subject', () => {
    const subject = new ReplaySubject();
    expect(subject).to.be.instanceof(Subject);
  });

  it('should add the observer before running subscription code', () => {
    const subject = new ReplaySubject<number>();
    subject.next(1);
    const results: number[] = [];

    subject.subscribe((value) => {
      results.push(value);
      if (value < 3) {
        subject.next(value + 1);
      }
    });

    expect(results).to.deep.equal([1, 2, 3]);
  });

  it('should replay values upon subscription', (done) => {
    const subject = new ReplaySubject<number>();
    const expects = [1, 2, 3];
    let i = 0;
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expects[i++]);
        if (i === 3) {
          subject.complete();
        }
      },
      error: (err: any) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  it('should replay values and complete', (done) => {
    const subject = new ReplaySubject<number>();
    const expects = [1, 2, 3];
    let i = 0;
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();
    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expects[i++]);
      },
      complete: done,
    });
  });

  it('should replay values and error', (done) => {
    const subject = new ReplaySubject<number>();
    const expects = [1, 2, 3];
    let i = 0;
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.error('fooey');
    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expects[i++]);
      },
      error: (err: any) => {
        expect(err).to.equal('fooey');
        done();
      },
    });
  });

  it('should only replay values within its buffer size', (done) => {
    const subject = new ReplaySubject<number>(2);
    const expects = [2, 3];
    let i = 0;
    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.subscribe({
      next: (x: number) => {
        expect(x).to.equal(expects[i++]);
        if (i === 2) {
          subject.complete();
        }
      },
      error: (err: any) => {
        done(new Error('should not be called'));
      },
      complete: () => {
        done();
      },
    });
  });

  describe('with bufferSize=2', () => {
    it('should replay 2 previous values when subscribed', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const replaySubject = new ReplaySubject<string>(2);
        function feedNextIntoSubject(x: string) {
          replaySubject.next(x);
        }
        function feedErrorIntoSubject(err: string) {
          replaySubject.error(err);
        }
        function feedCompleteIntoSubject() {
          replaySubject.complete();
        }

        const sourceTemplate = ' -1-2-3----4------5-6---7--8----9--|';
        const subscriber1 = hot('------(a|)                         ').pipe(mergeMapTo(replaySubject));
        const unsub1 = '         ---------------------!             ';
        const expected1 = '      ------(23)4------5-6--             ';
        const subscriber2 = hot('------------(b|)                   ').pipe(mergeMapTo(replaySubject));
        const unsub2 = '         -------------------------!         ';
        const expected2 = '      ------------(34)-5-6---7--         ';
        const subscriber3 = hot('---------------------------(c|)    ').pipe(mergeMapTo(replaySubject));
        const expected3 = '      ---------------------------(78)9--|';

        expectObservable(
          hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
        ).toBe(sourceTemplate);
        expectObservable(subscriber1, unsub1).toBe(expected1);
        expectObservable(subscriber2, unsub2).toBe(expected2);
        expectObservable(subscriber3).toBe(expected3);
      });
    });

    it('should replay 2 last values for when subscribed after completed', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const replaySubject = new ReplaySubject<string>(2);
        function feedNextIntoSubject(x: string) {
          replaySubject.next(x);
        }
        function feedErrorIntoSubject(err: string) {
          replaySubject.error(err);
        }
        function feedCompleteIntoSubject() {
          replaySubject.complete();
        }

        const sourceTemplate = ' -1-2-3--4--|';
        const subscriber1 = hot('---------------(a|) ').pipe(mergeMapTo(replaySubject));
        const expected1 = '      ---------------(34|)';

        expectObservable(
          hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
        ).toBe(sourceTemplate);
        expectObservable(subscriber1).toBe(expected1);
      });
    });

    it('should handle subscribers that arrive and leave at different times, ' + 'subject does not complete', () => {
      const subject = new ReplaySubject<number>(2);
      const results1: (number | string)[] = [];
      const results2: (number | string)[] = [];
      const results3: (number | string)[] = [];

      subject.next(1);
      subject.next(2);
      subject.next(3);
      subject.next(4);

      const subscription1 = subject.subscribe({
        next: (x: number) => {
          results1.push(x);
        },
        error: (err: any) => {
          results1.push('E');
        },
        complete: () => {
          results1.push('C');
        },
      });

      subject.next(5);

      const subscription2 = subject.subscribe({
        next: (x: number) => {
          results2.push(x);
        },
        error: (err: any) => {
          results2.push('E');
        },
        complete: () => {
          results2.push('C');
        },
      });

      subject.next(6);
      subject.next(7);

      subscription1.unsubscribe();

      subject.next(8);

      subscription2.unsubscribe();

      subject.next(9);
      subject.next(10);

      const subscription3 = subject.subscribe({
        next: (x: number) => {
          results3.push(x);
        },
        error: (err: any) => {
          results3.push('E');
        },
        complete: () => {
          results3.push('C');
        },
      });

      subject.next(11);

      subscription3.unsubscribe();

      expect(results1).to.deep.equal([3, 4, 5, 6, 7]);
      expect(results2).to.deep.equal([4, 5, 6, 7, 8]);
      expect(results3).to.deep.equal([9, 10, 11]);

      subject.complete();
    });
  });

  describe('with windowTime=4', () => {
    it('should replay previous values since 4 time units ago when subscribed', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const replaySubject = new ReplaySubject<string>(Infinity, 4, rxTestScheduler);
        function feedNextIntoSubject(x: string) {
          replaySubject.next(x);
        }
        function feedErrorIntoSubject(err: any) {
          replaySubject.error(err);
        }
        function feedCompleteIntoSubject() {
          replaySubject.complete();
        }

        const sourceTemplate = ' -1-2-3----4------5-6----7-8----9--|';
        const subscriber1 = hot('------(a|)                         ').pipe(mergeMapTo(replaySubject));
        const unsub1 = '         ---------------------!             ';
        const expected1 = '      ------(23)4------5-6--             ';
        const subscriber2 = hot('------------(b|)                   ').pipe(mergeMapTo(replaySubject));
        const unsub2 = '         -------------------------!         ';
        const expected2 = '      ------------4----5-6----7-         ';
        const subscriber3 = hot('---------------------------(c|)    ').pipe(mergeMapTo(replaySubject));
        const expected3 = '      ---------------------------(78)9--|';

        expectObservable(
          hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
        ).toBe(sourceTemplate);
        expectObservable(subscriber1, unsub1).toBe(expected1);
        expectObservable(subscriber2, unsub2).toBe(expected2);
        expectObservable(subscriber3).toBe(expected3);
      });
    });

    it('should replay last values since 4 time units ago when subscribed', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const replaySubject = new ReplaySubject<string>(Infinity, 4, rxTestScheduler);
        function feedNextIntoSubject(x: string) {
          replaySubject.next(x);
        }
        function feedErrorIntoSubject(err: any) {
          replaySubject.error(err);
        }
        function feedCompleteIntoSubject() {
          replaySubject.complete();
        }

        const sourceTemplate = ' -1-2-3----4|';
        const subscriber1 = hot('-------------(a|)').pipe(mergeMapTo(replaySubject));
        const expected1 = '      -------------(4|)';

        expectObservable(
          hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
        ).toBe(sourceTemplate);
        expectObservable(subscriber1).toBe(expected1);
      });
    });

    it('should only replay bufferSize items when 4 time units ago more were emited', () => {
      rxTestScheduler.run(({ hot, expectObservable }) => {
        const replaySubject = new ReplaySubject<string>(2, 4, rxTestScheduler);
        function feedNextIntoSubject(x: string) {
          replaySubject.next(x);
        }
        function feedErrorIntoSubject(err: any) {
          replaySubject.error(err);
        }
        function feedCompleteIntoSubject() {
          replaySubject.complete();
        }

        const sourceTemplate = ' 1234-------|';
        const subscriber1 = hot('----(a|)').pipe(mergeMapTo(replaySubject));
        const expected1 = '      ----(34)---|';

        expectObservable(
          hot(sourceTemplate).pipe(tap({ next: feedNextIntoSubject, error: feedErrorIntoSubject, complete: feedCompleteIntoSubject }))
        ).toBe(sourceTemplate);
        expectObservable(subscriber1).toBe(expected1);
      });
    });
  });

  it('should be an Observer which can be given to Observable.subscribe', () => {
    const source = of(1, 2, 3, 4, 5);
    const subject = new ReplaySubject<number>(3);
    let results: (number | string)[] = [];

    subject.subscribe({ next: (x) => results.push(x), complete: () => results.push('done') });

    source.subscribe(subject);

    expect(results).to.deep.equal([1, 2, 3, 4, 5, 'done']);

    results = [];

    subject.subscribe({ next: (x) => results.push(x), complete: () => results.push('done') });

    expect(results).to.deep.equal([3, 4, 5, 'done']);
  });

  it('should not buffer nexted values after complete', () => {
    const results: (number | string)[] = [];
    const subject = new ReplaySubject<number>();
    subject.next(1);
    subject.next(2);
    subject.complete();
    subject.next(3);
    subject.subscribe({
      next: (value) => results.push(value),
      complete: () => results.push('C'),
    });
    expect(results).to.deep.equal([1, 2, 'C']);
  });

  it('should not buffer nexted values after error', () => {
    const results: (number | string)[] = [];
    const subject = new ReplaySubject<number>();
    subject.next(1);
    subject.next(2);
    subject.error(new Error('Boom!'));
    subject.next(3);
    subject.subscribe({
      next: (value) => results.push(value),
      error: () => results.push('E'),
    });
    expect(results).to.deep.equal([1, 2, 'E']);
  });
});
