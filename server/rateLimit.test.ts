import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createRateLimiter } from './rateLimit.js'

describe('createRateLimiter', () => {
  it('libera até o limite da janela', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 })

    assert.equal(limiter.check('ip', 0).allowed, true)
    assert.equal(limiter.check('ip', 1).allowed, true)
  })

  it('bloqueia acima do limite e informa o retry', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 })

    limiter.check('ip', 0)
    limiter.check('ip', 1)
    const blocked = limiter.check('ip', 30_000)

    assert.deepEqual(blocked, { allowed: false, retryAfterSeconds: 30 })
  })

  it('reabre a janela depois do tempo', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })

    limiter.check('ip', 0)
    assert.equal(limiter.check('ip', 1_000).allowed, false)
    assert.equal(limiter.check('ip', 60_000).allowed, true)
  })

  it('isola chaves diferentes', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 })

    limiter.check('a', 0)
    assert.equal(limiter.check('a', 0).allowed, false)
    assert.equal(limiter.check('b', 0).allowed, true)
  })
})
