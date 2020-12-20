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