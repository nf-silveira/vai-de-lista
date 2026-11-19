import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizePrice, normalizeProductKey } from './products.js'

describe('normalizeProductKey', () => {
  it('remove acentos, caixa e espaços extras', () => {
    assert.equal(normalizeProductKey('  Café   com LEITE '), 'cafe com leite')
  })

  it('mantém produtos diferentes separados', () => {
    assert.notEqual(
      normalizeProductKey('Leite integral'),
      normalizeProductKey('Leite desnatado'),
    )
  })
})

describe('normalizePrice', () => {
  it('converte quilo para preço por grama', () => {
    assert.deepEqual(normalizePrice('kg', 12), { unit: 'g', price: 0.012 })
  })

  it('converte litro para preço por mililitro', () => {
    assert.deepEqual(normalizePrice('l', 6), { unit: 'ml', price: 0.006 })
  })

  it('mantém grama, mililitro e unidade', () => {
    assert.deepEqual(normalizePrice('g', 0.5), { unit: 'g', price: 0.5 })
    assert.deepEqual(normalizePrice('ml', 0.02), { unit: 'ml', price: 0.02 })
    assert.deepEqual(normalizePrice('un', 3), { unit: 'un', price: 3 })
  })

  it('não normaliza caixa nem preço desconhecido', () => {
    assert.deepEqual(normalizePrice('cx', 10), { unit: null, price: null })
    assert.deepEqual(normalizePrice('kg', null), { unit: null, price: null })
  })
})
