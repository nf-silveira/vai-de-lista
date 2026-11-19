import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ACCOUNT_STATUS_LABELS,
  isAccountRole,
  isAccountStatus,
  mayManageAccount,
} from '../shared/account.js'

describe('isAccountRole', () => {
  it('aceita admin e user', () => {
    assert.equal(isAccountRole('admin'), true)
    assert.equal(isAccountRole('user'), true)
  })

  it('recusa qualquer outro valor', () => {
    assert.equal(isAccountRole('owner'), false)
    assert.equal(isAccountRole(undefined), false)
  })
})

describe('isAccountStatus', () => {
  it('aceita os três estados do cadastro', () => {
    for (const status of ['pending', 'active', 'banned']) {
      assert.equal(isAccountStatus(status), true)
    }
  })

  it('recusa valores fora do domínio', () => {
    assert.equal(isAccountStatus('approved'), false)
    assert.equal(isAccountStatus(null), false)
  })

  it('tem rótulo para todos os estados', () => {
    assert.deepEqual(Object.keys(ACCOUNT_STATUS_LABELS).sort(), [
      'active',
      'banned',
      'pending',
    ])
  })
})

describe('mayManageAccount', () => {
  it('impede o administrador de agir sobre a própria conta', () => {
    assert.equal(mayManageAccount('user-1', 'user-1'), false)
  })

  it('permite agir sobre outra conta', () => {
    assert.equal(mayManageAccount('user-1', 'user-2'), true)
  })
})
