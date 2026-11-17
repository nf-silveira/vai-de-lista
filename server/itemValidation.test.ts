import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isValidItemId,
  validateItemPatch,
  validateNewItem,
} from './itemValidation.js'

describe('validateNewItem', () => {
  it('aplica unidade e preço padrão', () => {
    assert.deepEqual(validateNewItem({ name: 'Leite' }), {
      ok: true,
      value: { name: 'Leite', quantity: 1, unit: 'un', unitPrice: null },
    })
  })

  it('normaliza nome e aceita preço zero', () => {
    const result = validateNewItem({
      name: '  Leite integral ',
      quantity: '2',
      unit: 'l',
      unitPrice: 0,
    })

    assert.deepEqual(result, {
      ok: true,
      value: { name: 'Leite integral', quantity: 2, unit: 'l', unitPrice: 0 },
    })
  })

  it('rejeita corpo que não é objeto', () => {
    assert.deepEqual(validateNewItem(null), {
      ok: false,
      message: 'Corpo da requisição inválido.',
    })
  })

  it('rejeita quantidade não positiva', () => {
    const result = validateNewItem({ name: 'Leite', quantity: 0 })

    assert.deepEqual(result, {
      ok: false,
      message: 'A quantidade deve ser maior que zero.',
    })
  })

  it('rejeita preço negativo', () => {
    const result = validateNewItem({ name: 'Leite', unitPrice: -3 })

    assert.deepEqual(result, {
      ok: false,
      message: 'O preço unitário não pode ser negativo.',
    })
  })

  it('rejeita unidade desconhecida', () => {
    const result = validateNewItem({ name: 'Leite', unit: 'tonelada' })

    assert.deepEqual(result, { ok: false, message: 'Unidade inválida.' })
  })
})

describe('validateItemPatch', () => {
  it('aceita apenas os campos enviados', () => {
    assert.deepEqual(validateItemPatch({ quantity: 3 }), {
      ok: true,
      value: { quantity: 3 },
    })
  })

  it('permite limpar o preço com null', () => {
    assert.deepEqual(validateItemPatch({ unitPrice: null }), {
      ok: true,
      value: { unitPrice: null },
    })
  })

  it('aceita atualização de marcação', () => {
    assert.deepEqual(validateItemPatch({ isChecked: true }), {
      ok: true,
      value: { isChecked: true },
    })
  })

  it('exige ao menos um campo', () => {
    assert.deepEqual(validateItemPatch({}), {
      ok: false,
      message: 'Informe ao menos um campo para atualizar.',
    })
  })

  it('rejeita isChecked que não é booleano', () => {
    const result = validateItemPatch({ isChecked: 'true' })

    assert.deepEqual(result, {
      ok: false,
      message: 'O campo isChecked deve ser booleano.',
    })
  })

  it('rejeita nome curto na edição', () => {
    const result = validateItemPatch({ name: 'x' })

    assert.equal(result.ok, false)
  })
})

describe('isValidItemId', () => {
  it('aceita uuid v4', () => {
    assert.equal(isValidItemId('4bfc962a-06e7-48ef-825f-606c7a13e446'), true)
  })

  it('rejeita identificadores arbitrários', () => {
    assert.equal(isValidItemId('1'), false)
    assert.equal(isValidItemId('drop table shopping_items'), false)
  })
})
