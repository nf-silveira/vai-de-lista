import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isAutoApproved,
  parseEmailList,
  readAutoApprovedEmails,
} from './access.js'

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

describe('readAutoApprovedEmails', () => {
  it('usa apenas ALLOWED_EMAILS', () => {
    assert.deepEqual(
      readAutoApprovedEmails({
        ALLOWED_EMAILS: 'casa@exemplo.com',
        SEED_USER_1_EMAIL: 'usuario1@vaidelista.app',
      }),
      ['casa@exemplo.com'],
    )
  })

  it('não aprova contas de seed automaticamente', () => {
    assert.deepEqual(
      readAutoApprovedEmails({ SEED_USER_1_EMAIL: 'usuario1@vaidelista.app' }),
      [],
    )
  })
})

describe('isAutoApproved', () => {
  const approved = ['casa@exemplo.com']

  it('reconhece o e-mail ignorando caixa e espaços', () => {
    assert.equal(isAutoApproved(' Casa@Exemplo.com ', approved), true)
  })

  it('mantém pendente quem não está na lista', () => {
    assert.equal(isAutoApproved('intruso@exemplo.com', approved), false)
  })
})
