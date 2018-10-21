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
    instance = new Lock(id, locks[id]);
    await locks[id].promise;
  } else {
    instance = new Lock(id);
    locks[id] = instance;
  }

  return () => {
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
  id = null;
  refCount = 0;
  rootDependency = null;
  /**
   *
   * @param dependency {Lock}
   */
  constructor(id, dependency = null) {
    const rootDependency = dependency ? dependency.rootDependency || dependency : null;
    if (rootDependency) {
      this.rootDependency = rootDependency;
      rootDependency.refCount += 1;
    }

    this.id = id;
    this.release = () => { console.warn('Cannot release yet') };
    this.promise = new Promise(async resolve => {
      if (dependency) {
        await dependency.promise;
      }
      this.release = () => {
        dbg(`Release the lock id ${id}`);
        resolve();

        if (rootDependency) {
          rootDependency.refCount -= 1;
          if (rootDependency.refCount === 0) {
            dbg(`Freeing the lock id ${id}`);

            locks[id] = undefined;
            delete locks[id];
          }
        }
      };
    })
  }
}