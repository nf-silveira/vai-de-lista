import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { withExplicitSsl } from './pgConnection.js'

const NEON =
  'postgresql://role:senha@ep-exemplo-pooler.us-east-2.aws.neon.tech/neondb'

describe('withExplicitSsl', () => {
  it('troca os modos que o pg 9 vai tratar de outro jeito por verify-full', () => {
    for (const mode of ['prefer', 'require', 'verify-ca']) {
      const result = withExplicitSsl(`${NEON}?sslmode=${mode}`)

      assert.equal(new URL(result).searchParams.get('sslmode'), 'verify-full')
    }
  })

  it('preserva verify-full, no-verify e disable', () => {
    for (const mode of ['verify-full', 'no-verify', 'disable']) {
      const url = `${NEON}?sslmode=${mode}`

      assert.equal(withExplicitSsl(url), url)
    }
  })

  it('não inventa sslmode quando a URL não traz o parâmetro', () => {
    assert.equal(withExplicitSsl(NEON), NEON)
  })

  it('mantém os outros parâmetros da URL', () => {
    const result = withExplicitSsl(
      `${NEON}?sslmode=require&channel_binding=require`,
    )
    const params = new URL(result).searchParams

    assert.equal(params.get('sslmode'), 'verify-full')
    assert.equal(params.get('channel_binding'), 'require')
  })

  it('devolve a string original quando não é uma URL', () => {
    assert.equal(withExplicitSsl('nao-e-uma-url'), 'nao-e-uma-url')
  })
})
