# Okie

> "Okie dokie, work work"

Dead simple worker threads pool.

```js
const { Worker } = require('okie')

const worker = new Worker(n => n + 1, {
  max: 3 // defaults to os.cpus().length - 1
})

;(async () => {
  const result = await worker.run(1)
  console.log(result) // logs "2"

  worker.stop()
})()
```

You can also use path.

```js
// worker.js
const { join } = require('path')
const { parentPort } = require('worker_threads')

const doWork = n => n + 1

parentPort.on('message', async (args) => {
  const res = await doWork(...args)
  parentPort.postMessage(res)
})

// main.js
const { Worker } = require('okie')
const worker = new Worker(join(__dirname, './worker.js'), {
  max: 3 // defaults to os.cpus().length - 1
})

;(async () => {
  const result = await worker.run(1)
  console.log(result) // logs "2"

  worker.stop()
})()
```