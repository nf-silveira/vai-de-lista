import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type {
  ItemUnit,
  ShoppingItem,
} from '../../../../shared/shopping-list'
import { createItemDraft, parseItemDraft } from './itemDraft'

const baseDraft = {
  name: 'Arroz',
  quantity: '2',
  unit: 'kg',
  unitPrice: '24,90',
} as const

describe('parseItemDraft', () => {
  it('converte vírgula decimal e espaços', () => {
    const result = parseItemDraft({
      name: '  Arroz  ',
      quantity: '1,5',
      unit: 'kg',
      unitPrice: ' 24,90 ',
    })

    assert.deepEqual(result, {
      ok: true,
      value: { name: 'Arroz', quantity: 1.5, unit: 'kg', unitPrice: 24.9 },
    })
  })

  it('aceita preço vazio como preço desconhecido', () => {
    const result = parseItemDraft({ ...baseDraft, unitPrice: '' })

    assert.equal(result.ok, true)
    assert.equal(result.ok && result.value.unitPrice, null)
  })

  it('mantém preço zero como valor conhecido', () => {
    const result = parseItemDraft({ ...baseDraft, unitPrice: '0' })

    assert.equal(result.ok, true)
    assert.equal(result.ok && result.value.unitPrice, 0)
  })

  it('rejeita nome curto', () => {
    const result = parseItemDraft({ ...baseDraft, name: ' a ' })

    assert.deepEqual(result, {
      ok: false,
      message: 'Informe o nome do produto.',
    })
  })

  it('rejeita nome acima de 80 caracteres', () => {
    const result = parseItemDraft({ ...baseDraft, name: 'a'.repeat(81) })

    assert.equal(result.ok, false)
  })

  it('rejeita quantidade zero ou inválida', () => {
    assert.equal(parseItemDraft({ ...baseDraft, quantity: '0' }).ok, false)
    assert.equal(parseItemDraft({ ...baseDraft, quantity: 'abc' }).ok, false)
  })

  it('rejeita preço negativo', () => {
    const result = parseItemDraft({ ...baseDraft, unitPrice: '-1' })

    assert.deepEqual(result, {
      ok: false,
      message: 'O preço não pode ser negativo.',
    })
  })

  it('rejeita unidade fora da lista', () => {
    const result = parseItemDraft({
      ...baseDraft,
      unit: 'tonelada' as ItemUnit,
    })

    assert.equal(result.ok, false)
  })
})

describe('createItemDraft', () => {
  it('inicia um rascunho vazio com unidade padrão', () => {
    assert.deepEqual(createItemDraft(), {
      name: '',
      quantity: '1',
      unit: 'un',
      unitPrice: '',
    })
  })

  it('converte um item existente para edição', () => {
    const item: ShoppingItem = {
      id: '00000000-0000-4000-8000-000000000000',
      name: 'Café',
      quantity: 1.5,
      unit: 'kg',
      unitPrice: 39.9,
      isChecked: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    assert.deepEqual(createItemDraft(item), {
      name: 'Café',
      quantity: '1,5',
      unit: 'kg',
      unitPrice: '39,9',
    })
  })

  it('mantém preço vazio quando o item não tem preço', () => {
    const item: ShoppingItem = {
      id: '00000000-0000-4000-8000-000000000000',
      name: 'Pão',
      quantity: 1,
      unit: 'un',
      unitPrice: null,
      isChecked: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    assert.equal(createItemDraft(item).unitPrice, '')
  })
})
