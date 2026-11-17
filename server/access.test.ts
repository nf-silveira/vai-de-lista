import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { checkMemberAccess, parseEmailList, readMemberEmails } from './access.js'

describe('parseEmailList', () => {
  it('normaliza, descarta vazios e remove duplicados', () => {
    assert.deepEqual(
      parseEmailList(' Casa@Exemplo.com, ,casa@exemplo.com,outra@exemplo.com '),
      ['casa@exemplo.com', 'outra@exemplo.com'],
    )
  })

  it('trata variável ausente como lista vazia', () => {
    assert.deepEqual(parseEmailList(undefined), [])
  })
})

describe('readMemberEmails', () => {
  it('usa apenas ALLOWED_EMAILS', () => {
    assert.deepEqual(
      readMemberEmails({
        ALLOWED_EMAILS: 'casa@exemplo.com',
        SEED_USER_1_EMAIL: 'usuario1@vaidelista.app',
      }),
      ['casa@exemplo.com'],
    )
  })

  it('não promove contas de seed a membros', () => {
    assert.deepEqual(
      readMemberEmails({ SEED_USER_1_EMAIL: 'usuario1@vaidelista.app' }),
      [],
    )
  })
})

describe('checkMemberAccess', () => {
  const members = ['casa@exemplo.com']

  it('libera membro listado', () => {
    assert.deepEqual(
      checkMemberAccess('Casa@Exemplo.com ', members, { isProduction: true }),
      { allowed: true, reason: 'allowed' },
    )
  })

  it('bloqueia conta que não está na lista', () => {
    assert.deepEqual(
      checkMemberAccess('intruso@exemplo.com', members, { isProduction: true }),
      { allowed: false, reason: 'not-listed' },
    )
  })

  it('em produção falha fechado quando não há allowlist', () => {
    assert.deepEqual(
      checkMemberAccess('casa@exemplo.com', [], { isProduction: true }),
      { allowed: false, reason: 'not-configured' },
    )
  })

  it('fora de produção segue liberado sem allowlist', () => {
    assert.deepEqual(
      checkMemberAccess('casa@exemplo.com', [], { isProduction: false }),
      { allowed: true, reason: 'not-configured' },
    )
  })
})
