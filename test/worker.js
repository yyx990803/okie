const { parentPort } = require('worker_threads')

const doWork = async ({n}) => {
  return new Promise((r) => {
    setTimeout(() => {
      r(n + 1)
    }, Math.floor(Math.random() * 100))
  })
}

parentPort.on('message', async (args) => {
  const res = await doWork(...args)
  parentPort.postMessage(res)
})