import { expect } from 'chai';
import { ArgumentOutOfRangeError } from 'rxjs';

/** @test {ArgumentOutOfRangeError} */
describe('ArgumentOutOfRangeError', () => {
  const error = new ArgumentOutOfRangeError();
  it('Should have a name', () => {
    expect(error.name).to.be.equal('ArgumentOutOfRangeError');
  });
  it('Should have a message', () => {
    expect(error.message).to.be.equal('argument out of range');
  });
  it('Should have a stack', () => {
    expect(error.stack).to.be.a('string');
  });
});
import { expect } from 'chai';
import { EmptyError } from 'rxjs';

/** @test {EmptyError} */
describe('EmptyError', () => {
  const error = new EmptyError();
  it('Should have a name', () => {
    expect(error.name).to.be.equal('EmptyError');
  });
  it('Should have a message', () => {
    expect(error.message).to.be.equal('no elements in sequence');
  });
  it('Should have a stack', () => {
    expect(error.stack).to.be.a('string');
  });
});
import { expect } from 'chai';
// TODO: import was changed due to the fact that at startup the test referred to rxjs from node_modules
import { Immediate, TestTools } from '../../src/internal/util/Immediate';

describe('Immediate', () => {
  it('should schedule on the next microtask', (done) => {
    const results: number[] = [];
    results.push(1);
    setTimeout(() => results.push(5));
    Immediate.setImmediate(() => results.push(3));
    results.push(2);
    Promise.resolve().then(() => results.push(4));

    setTimeout(() => {
      expect(results).to.deep.equal([1, 2, 3, 4, 5]);
      done();
    });
  });

  it('should cancel the task with clearImmediate', (done) => {
    const results: number[] = [];
    results.push(1);
    setTimeout(() => results.push(5));
    const handle = Immediate.setImmediate(() => results.push(3));
    Immediate.clearImmediate(handle);
    results.push(2);
    Promise.resolve().then(() => results.push(4));

    setTimeout(() => {
      expect(results).to.deep.equal([1, 2, 4, 5]);
      done();
    });
  });

  it('should clear the task after execution', (done) => {
    const results: number[] = [];
    Immediate.setImmediate(() => results.push(1));
    Immediate.setImmediate(() => results.push(2));

    setTimeout(() => {
      const number = TestTools.pending();
      expect(number).to.equal(0);
      done();
    });
  });
});
import { expect } from 'chai';
import { ObjectUnsubscribedError } from 'rxjs';

/** @test {ObjectUnsubscribedError} */
describe('ObjectUnsubscribedError', () => {
  const error = new ObjectUnsubscribedError();
  it('Should have a name', () => {
    expect(error.name).to.be.equal('ObjectUnsubscribedError');
  });
  it('Should have a message', () => {
    expect(error.message).to.be.equal('object unsubscribed');
  });
  it('Should have a stack', () => {
    expect(error.stack).to.be.a('string');
  });
});
import { expect } from 'chai';
import { TimeoutError } from 'rxjs';

/** @test {TimeoutError} */
describe('TimeoutError', () => {
  const error = new TimeoutError();
  it('Should have a name', () => {
    expect(error.name).to.be.equal('TimeoutError');
  });
  it('Should have a message', () => {
    expect(error.message).to.be.equal('Timeout has occurred');
  });
  it('Should have a stack', () => {
    expect(error.stack).to.be.a('string');
  });
});
import { expect } from 'chai';
import { UnsubscriptionError, Observable, timer, merge } from 'rxjs';

/** @test {UnsubscriptionError} */
describe('UnsubscriptionError', () => {
  it('should create a message that is a clear indication of its internal errors', () => {
    const err1 = new Error('Swiss cheese tastes amazing but smells like socks');
    const err2 = new Error('User too big to fit in tiny European elevator');
    const source1 = new Observable(() => () => { throw err1; });
    const source2 = timer(1000);
    const source3 = new Observable(() => () => { throw err2; });
    const source = merge(source1, source2, source3);

    const subscription = source.subscribe();

    try {
      subscription.unsubscribe();
    } catch (err) {
      if (err instanceof UnsubscriptionError) {
        expect(err.errors).to.deep.equal([err1, err2]);
        expect(err.name).to.equal('UnsubscriptionError');
        expect(err.stack).to.be.a('string');
      } else {
        throw new TypeError('Invalid error type');
      }
    }
  });
});
/** @prettier */
import { createErrorClass } from 'rxjs/internal/util/createErrorClass';
import { expect } from 'chai';

describe('createErrorClass', () => {
  it('should create a class that subclasses error and has the right properties', () => {
    const MySpecialError: any = createErrorClass(
      (_super) =>
        function MySpecialError(this: any, arg1: number, arg2: string) {
          _super(this);
          this.message = 'Super special error!';
          this.arg1 = arg1;
          this.arg2 = arg2;
        }
    );

    expect(MySpecialError).to.be.a('function');
    const err = new MySpecialError(123, 'Test');
    expect(err).to.be.an.instanceOf(Error);
    expect(err).to.be.an.instanceOf(MySpecialError);
    expect(err.constructor).to.equal(MySpecialError);
    expect(err.stack).to.be.a('string');
    expect(err.message).to.equal('Super special error!');
    expect(err.arg1).to.equal(123);
    expect(err.arg2).to.equal('Test');
  });
});
import { Observable, isObservable } from 'rxjs';
import { expect } from 'chai';

describe('isObservable', () => {
  it('should return true for RxJS Observable', () => {
    const o = new Observable<any>();
    expect(isObservable(o)).to.be.true;
  });

  it('should return true for an observable that comes from another RxJS 5+ library', () => {
    const o: any = {
      lift() { /* noop */ },
      subscribe() { /* noop */ },
    };

    expect(isObservable(o)).to.be.true;
  });

  it('should NOT return true for any old subscribable', () => {
    const o: any = {
      subscribe() { /* noop */ },
    };

    expect(isObservable(o)).to.be.false;
  });

  it('should return false for null', () => {
    expect(isObservable(null)).to.be.false;
  });

  it('should return false for a number', () => {
    expect(isObservable(1)).to.be.false;
  });

});
import { of } from 'rxjs';
import { expect } from 'chai';
import { isPromise } from 'rxjs/internal/util/isPromise';

describe('isPromise', () => {
  it('should return true for new Promise', () => {
    const o = new Promise<any>(() => null);
    expect(isPromise(o)).to.be.true;
  });

  it('should return true for a Promise that comes from an Observable', () => {
    const o: any = of(null).toPromise();
    expect(isPromise(o)).to.be.true;
  });

  it('should NOT return true for any Observable', () => {
    const o: any = of(null);

    expect(isPromise(o)).to.be.false;
  });

  it('should return false for null', () => {
    expect(isPromise(null)).to.be.false;
  });

  it('should return false for undefined', () => {
    expect(isPromise(undefined)).to.be.false;
  });

  it('should return false for a number', () => {
    expect(isPromise(1)).to.be.false;
  });

  it('should return false for a string', () => {
    expect(isPromise('1')).to.be.false;
  });

});
import { expect } from 'chai';
import { pipe } from 'rxjs';

describe('pipe', () => {
  it('should exist', () => {
    expect(pipe).to.be.a('function');
  });

  it('should pipe two functions together', () => {
    const a = (x: number) => x + x;
    const b = (x: number) => x - 1;

    const c = pipe(a, b);
    expect(c).to.be.a('function');
    expect(c(1)).to.equal(1);
    expect(c(10)).to.equal(19);
  });

  it('should return the same function if only one is passed', () => {
    const a = <T>(x: T) => x;
    const c = pipe(a);

    expect(c).to.equal(a);
  });

  it('should return the identity if not passed any functions', () => {
    const c = pipe();

    expect(c('whatever')).to.equal('whatever');
    const someObj = {};
    expect(c(someObj)).to.equal(someObj);
  });
});
