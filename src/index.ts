import os from 'os'
import { Worker as _Worker } from 'worker_threads'

interface NodeWorker extends _Worker {
  currentResolve: ((value: any) => void) | null
  currentReject: ((err: Error) => void) | null
}

export interface Options {
  max?: number
}

export class Worker<Args extends any[], Ret = any> {
  private code: string
  private max: number
  private pool: NodeWorker[]
  private idlePool: NodeWorker[]
  private queue: [(worker: NodeWorker) => void, (err: Error) => void][]

  constructor(
    fn: (...args: Args) => Promise<Ret> | Ret,
    options: Options = {}
  ) {
    this.code = genWorkerCode(fn)
    this.max = options.max || Math.max(1, os.cpus().length - 1)
    this.pool = []
    this.idlePool = []
    this.queue = []
  }

  async run(...args: Args): Promise<Ret> {
    const worker = await this._getAvailableWorker()
    return new Promise<Ret>((resolve, reject) => {
      worker.currentResolve = resolve
      worker.currentReject = reject
      worker.postMessage(args)
    })
  }

  stop() {
    this.pool.forEach((w) => w.terminate())
    this.queue.forEach(([_, reject]) =>
      reject(
        new Error('Main worker pool stopped before a worker was available.')
      )
    )
    this.pool = []
    this.idlePool = []
    this.queue = []
  }

  private async _getAvailableWorker(): Promise<NodeWorker> {
    // has idle one?
    if (this.idlePool.length) {
      return this.idlePool.shift()!
    }

    // can spawn more?
    if (this.pool.length < this.max) {
      const worker = new _Worker(this.code, { eval: true }) as NodeWorker

      worker.on('message', (res) => {
        worker.currentResolve && worker.currentResolve(res)
        worker.currentResolve = null
        this._assignDoneWorker(worker)
      })

      worker.on('error', (err) => {
        worker.terminate()
        this.pool.splice(this.pool.indexOf(worker), 1)
        worker.currentReject && worker.currentReject(err)
        worker.currentReject = null
      })

      worker.on('exit', (code) => {
        this.pool.splice(this.pool.indexOf(worker), 1)
        if (code !== 0) {
          worker.currentReject &&
            worker.currentReject(
              new Error(`Wroker stopped with non-0 exit code ${code}`)
            )
          worker.currentReject = null
        }
      })

      this.pool.push(worker)
      return worker
    }

    // no one is available, we have to wait
    let resolve: (worker: NodeWorker) => void
    let reject: (err: Error) => any
    const onWorkerAvailablePromise = new Promise<NodeWorker>((r, rj) => {
      resolve = r
      reject = rj
    })
    this.queue.push([resolve!, reject!])
    return onWorkerAvailablePromise
  }

  private _assignDoneWorker(worker: NodeWorker) {
    // someone's waiting already?
    if (this.queue.length) {
      const [resolve] = this.queue.shift()!
      resolve(worker)
      return
    }
    // take a rest.
    this.idlePool.push(worker)
  }
}

function genWorkerCode(fn: Function) {
  return `
const doWork = ${fn.toString()}

const { parentPort } = require('worker_threads')

parentPort.on('message', async (args) => {
  const res = await doWork(...args)
  parentPort.postMessage(res)
})
  `
}
