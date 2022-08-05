import { getDirection } from '../src/helpers';

describe('Helpers', () => {
  describe('getDirection', () => {
    it('should return start for left', () => {
      getDirection('left', false).should.equal('start');
    });

    it('should return end for left in RTL', () => {
      getDirection('left', true).should.equal('end');
    });

    it('should return end for right', () => {
      getDirection('right', false).should.equal('end');
    });

    it('should return start for right in RTL', () => {
      getDirection('right', true).should.equal('start');
    });
  });
});
