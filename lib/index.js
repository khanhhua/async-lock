import debug from 'debug';
import stackTrace from 'stack-trace';
const locks = {};

const dbg = debug('async-lock');
/**
 * @async
 * @return
 */
export default async function lock() {
  const caller = callerId(lock);
  const id = `${caller.filePath}:${caller.lineNumber}`;

  let instance;

  if (id in locks) {
    instance = new Lock(locks[id]);
    await locks[id].promise;
  } else {
    instance = new Lock();
    locks[id] = instance;
    instance.promise.then(() => {
      // Release the lock reference
      dbg(`Freeing the lock id ${id}`);
      locks[id] = null;
      delete locks[id];
    })
  }

  return () => {
    dbg(`Releasing the kraken ${id}`);
    instance.release();
  }
}

function callerId(fn) {
  const trace = stackTrace.get(fn);

  return {
    filePath: trace[0].getFileName(),
    lineNumber: trace[0].getLineNumber()
  };
}

class Lock {
  /**
   *
   * @param dependency {Lock}
   */
  constructor(dependency = null) {
    this.release = () => { console.log('Cannot release yet') };
    this.promise = new Promise(async resolve => {
      if (dependency) {
        await dependency.promise;
      }
      this.release = resolve;
    })
  }
}