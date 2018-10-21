# async-lock

[![Build Status](https://travis-ci.org/khanhhua/async-lock.svg?branch=master)](https://travis-ci.org/khanhhua/async-lock)

`async-lock` is a semaphore for Node 6+ to prevent re-entrance in a
single Node process.

## Usage

### Invoke `lock` then `release`

To lock a critical section, invoke the async `lock()` which returns a
function to be invoked when the lock is ready to be released.

Assuming a function `dbUpdateLikes` with a critical section in module
`db.js`

```
async function dbUpdateLikes(postId) {
    const post = await Post.findById(postId).exec();
    post.likes += 1;

    // Critical section
    await lock();

    await post.save();

    // End of critical section
    release();
    // Finishes of the function
}
```

and a http handler module `routes.js`

```
async function like(ctx) {
    // Do whatever here
    await db.dbUpdateLikes(ctx.params.postId)

    ctx.body = { ok: true };
}
```