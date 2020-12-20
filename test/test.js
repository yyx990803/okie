const { Worker } = require('../dist/index')

test('should work', async () => {
  const worker = new Worker(async ({ n }) => {
    return new Promise((r) => {
      setTimeout(() => {
        r(n + 1)
      }, Math.floor(Math.random() * 100))
    })
  })

  const results = await Promise.all([
    worker.run({ n: 1 }),
    worker.run({ n: 2 }),
    worker.run({ n: 3 }),
    worker.run({ n: 4 }),
    worker.run({ n: 5 }),
    worker.run({ n: 6 }),
    worker.run({ n: 7 }),
    worker.run({ n: 8 }),
    worker.run({ n: 9 })
  ])

  worker.stop()
  expect(results).toMatchObject([2, 3, 4, 5, 6, 7, 8, 9, 10])
})
