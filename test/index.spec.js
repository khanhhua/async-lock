import { expect } from 'chai';
import lock from '../lib';

describe('AsyncLock', () => {
  it('should be a function that returns a release function', async () => {
    expect(lock).to.be.a('function');
    const release = await lock();
    expect(release).to.be.a('function');
  });

  it('should maintain sequential order', async () => {
    let sharedVar = 0;

    async function expensive(nth) {
      const release = await lock();
      await new Promise(resolve => setTimeout(resolve, 100));

      sharedVar = nth;
      release();
      return nth;
    }

    await Promise.all([
      expensive(1),
      expensive(2),
      expensive(3),
      expensive(4),
      expensive(5),
    ]);

    expect(sharedVar).to.be.equal(5);
  });

  it('should lock code section per module:line scope', async () => {
    let sharedVar = 0;

    async function sequence1(nth) {
      const release = await lock();
      await new Promise(resolve => setTimeout(resolve, 100));

      sharedVar = nth;
      release();
      return nth;
    }
    async function sequence2(nth) {
      const release = await lock();
      await new Promise(resolve => setTimeout(resolve, 10));

      sharedVar = nth;
      release();
      return nth;
    }

    await Promise.all([
      sequence1(1),
      sequence1(2),
      sequence2('a'),
      sequence2('b'),
    ]);

    // As sequence1 finishes later (200ms), sharedVar is always 2
    expect(sharedVar).to.be.equal(2);
  });
});