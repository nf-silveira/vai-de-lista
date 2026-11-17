import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { ShoppingItem } from '../../../../shared/shopping-list'
import { summarizeItems } from './summarizeItems'

function createItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    name: 'Item',
    quantity: 1,
    unit: 'un',
    unitPrice: null,
    isChecked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('summarizeItems', () => {
  it('retorna zeros para lista vazia', () => {
    assert.deepEqual(summarizeItems([]), {
      total: 0,
      checkedCount: 0,
      itemsWithoutPrice: 0,
    })
  })

  it('soma quantidade vezes preço unitário', () => {
    const summary = summarizeItems([
      createItem({ quantity: 3, unitPrice: 4.5 }),
      createItem({ quantity: 2, unitPrice: 10 }),
    ])

    assert.equal(summary.total, 33.5)
    assert.equal(summary.itemsWithoutPrice, 0)
  })

  it('ignora itens sem preço no total e os contabiliza', () => {
    const summary = summarizeItems([
      createItem({ quantity: 2, unitPrice: 5 }),
      createItem({ quantity: 4, unitPrice: null }),
    ])

    assert.equal(summary.total, 10)
    assert.equal(summary.itemsWithoutPrice, 1)
  })

  it('não trata preço zero como preço desconhecido', () => {
    const summary = summarizeItems([createItem({ quantity: 5, unitPrice: 0 })])

    assert.equal(summary.total, 0)
    assert.equal(summary.itemsWithoutPrice, 0)
  })

  it('conta itens marcados como comprados', () => {
    const summary = summarizeItems([
      createItem({ isChecked: true }),
      createItem({ isChecked: false }),
      createItem({ isChecked: true }),
    ])

    assert.equal(summary.checkedCount, 2)
  })
})
