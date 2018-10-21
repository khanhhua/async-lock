import callerId from 'caller-id';
const locks = {};
/**
 * @async
 * @return
 */
export default async function lock() {
  const caller = callerId.getData(arguments);
  const id = `${caller.filePath}:${caller.lineNumber}`;

  let instance;

  if (id in locks) {
    instance = new Lock(locks[id].pr);
    await locks[id].promise;
  } else {
    instance = new Lock();
    locks[id] = instance;
    instance.promise.then(() => {
      // Release the lock reference
      locks[id] = null;
    })
  }

  return () => {
    console.log('Releasing the kraken');
    instance.release();
  }
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