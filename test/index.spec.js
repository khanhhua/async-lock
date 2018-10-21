import { expect } from 'chai';
import lock from '../lib';

describe('AsyncLock', () => {
  it('should be a function that returns a release function', async () => {
    expect(lock).to.be.a('function');
    const release = await lock();
    expect(release).to.be.a('function');
  });

  it('should lock code section per module scope', async () => {
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
});