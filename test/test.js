const { Worker } = require('../dist/index')

test('should work', async () => {
  const worker = new Worker(async (n) => {
    return new Promise((r) => {
      setTimeout(() => {
        r(n + 1)
      }, Math.floor(Math.random() * 100))
    })
  })

  const results = await Promise.all([
    worker.run(1),
    worker.run(2),
    worker.run(3),
    worker.run(4),
    worker.run(5),
    worker.run(6),
    worker.run(7),
    worker.run(8),
    worker.run(9)
  ])

  worker.stop()
  expect(results).toMatchObject([2, 3, 4, 5, 6, 7, 8, 9, 10])
})
