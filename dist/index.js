'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _stackTrace = require('stack-trace');

var _stackTrace2 = _interopRequireDefault(_stackTrace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const locks = {};

const dbg = (0, _debug2.default)('async-lock');
/**
 * @async
 * @return
 */

exports.default = async function lock() {
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
  };
};

function callerId(fn) {
  const trace = _stackTrace2.default.get(fn);

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
  constructor(id, dependency = null) {
    this.id = null;
    this.refCount = 0;
    this.rootDependency = null;

    const rootDependency = dependency ? dependency.rootDependency || dependency : null;
    if (rootDependency) {
      this.rootDependency = rootDependency;
      rootDependency.refCount += 1;
    }

    this.id = id;
    this.release = () => {
      console.warn('Cannot release yet');
    };
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
    });
  }
}