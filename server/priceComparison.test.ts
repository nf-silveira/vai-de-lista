import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PriceObservation } from '../shared/comparison.js'
import type { ItemUnit } from '../shared/shopping-list.js'
import { buildComparison } from './priceComparison.js'

const now = new Date('2026-11-19T15:00:00.000Z')

interface ObservationInput {
  id: string
  purchasedAt: string
  unitPrice: number
  unit?: ItemUnit
  quantity?: number
  normalizedUnit?: string | null
  normalizedUnitPrice?: number | null
}

function observation(input: ObservationInput): PriceObservation {
  const unit = input.unit ?? 'un'

  return {
    id: input.id,
    productName: 'Leite',
    quantity: input.quantity ?? 1,
    unit,
    unitPrice: input.unitPrice,
    normalizedUnit:
      input.normalizedUnit !== undefined ? input.normalizedUnit : 'un',
    normalizedUnitPrice:
      input.normalizedUnitPrice !== undefined
        ? input.normalizedUnitPrice
        : input.unitPrice,
    purchasedAt: input.purchasedAt,
  }
}

function current(unitPrice: number, purchasedAt = now.toISOString()) {
  return observation({
    id: 'current',
    purchasedAt,
    unitPrice,
    unit: 'kg',
    normalizedUnit: 'g',
    normalizedUnitPrice: unitPrice / 1000,
  })
}

describe('buildComparison', () => {
  it('compara com a compra anterior e calcula diferença e percentual', () => {
    const previous = observation({
      id: 'previous',
      purchasedAt: '2026-11-15T12:00:00.000Z',
      unitPrice: 10,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.01,
    })

    const [reference] = buildComparison(current(12), [previous], now)

    assert.equal(reference.period, 'previous')
    assert.equal(reference.comparable, true)
    assert.equal(reference.basisUnit, 'kg')
    assert.equal(reference.referencePrice, 10)
    assert.equal(reference.difference, 2)
    assert.equal(reference.percentage, 20)
  })

  it('escolhe o registro mais recente dentro dos últimos 7 dias', () => {
    const older = observation({
      id: 'older',
      purchasedAt: '2026-11-13T10:00:00.000Z',
      unitPrice: 9,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.009,
    })
    const recent = observation({
      id: 'recent',
      purchasedAt: '2026-11-17T10:00:00.000Z',
      unitPrice: 10,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.01,
    })

    const [, last7Days] = buildComparison(
      current(12),
      [recent, older],
      now,
    )

    assert.equal(last7Days.comparable, true)
    assert.equal(last7Days.observation?.id, 'recent')
    assert.equal(last7Days.referencePrice, 10)
    assert.equal(last7Days.percentage, 20)
  })

  it('usa o mês-calendário anterior ao mês da compra atual', () => {
    const currentInNovember = current(
      12,
      '2026-11-05T12:00:00.000Z',
    )
    const october = observation({
      id: 'october',
      purchasedAt: '2026-10-20T12:00:00.000Z',
      unitPrice: 8,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.008,
    })
    const september = observation({
      id: 'september',
      purchasedAt: '2026-09-28T12:00:00.000Z',
      unitPrice: 7,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.007,
    })

    const [, last7Days, previousMonth] = buildComparison(
      currentInNovember,
      [october, september],
      new Date('2026-11-05T15:00:00.000Z'),
    )

    assert.equal(last7Days.observation, null)
    assert.equal(previousMonth.observation?.id, 'october')
    assert.equal(previousMonth.referencePrice, 8)
    assert.equal(previousMonth.percentage, 50)
  })

  it('normaliza unidades compatíveis (kg contra g)', () => {
    const previousInGrams = observation({
      id: 'grams',
      purchasedAt: '2026-11-15T12:00:00.000Z',
      unitPrice: 0.01,
      unit: 'g',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.01,
    })

    const [reference] = buildComparison(current(12), [previousInGrams], now)

    assert.equal(reference.comparable, true)
    assert.equal(reference.basisUnit, 'kg')
    assert.equal(reference.referencePrice, 10)
    assert.equal(reference.difference, 2)
    assert.equal(reference.percentage, 20)
  })

  it('bloqueia unidades incompatíveis e explica o motivo', () => {
    const previousPerUnit = observation({
      id: 'unit',
      purchasedAt: '2026-11-15T12:00:00.000Z',
      unitPrice: 5,
      unit: 'un',
      normalizedUnit: 'un',
      normalizedUnitPrice: 5,
    })

    const [reference] = buildComparison(current(12), [previousPerUnit], now)

    assert.equal(reference.comparable, false)
    assert.equal(reference.difference, null)
    assert.equal(reference.percentage, null)
    assert.match(reference.note ?? '', /unidades diferentes \(kg e un\)/)
  })

  it('não divide por zero quando o preço anterior é zero', () => {
    const previous = observation({
      id: 'zero',
      purchasedAt: '2026-11-15T12:00:00.000Z',
      unitPrice: 0,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0,
    })

    const [reference] = buildComparison(current(12), [previous], now)

    assert.equal(reference.comparable, true)
    assert.equal(reference.percentage, null)
    assert.equal(reference.difference, 12)
    assert.match(reference.note ?? '', /preço anterior era zero/)
  })

  it('explica quando não há histórico', () => {
    const [previous, last7Days, previousMonth] = buildComparison(
      current(12),
      [],
      now,
    )

    assert.equal(previous.observation, null)
    assert.match(previous.note ?? '', /Primeira vez/)
    assert.match(last7Days.note ?? '', /últimos 7 dias/)
    assert.match(previousMonth.note ?? '', /mês anterior/)
  })

  it('preserva quantidade e unidade da observação de referência', () => {
    const previous = observation({
      id: 'previous',
      purchasedAt: '2026-11-15T12:00:00.000Z',
      unitPrice: 10,
      unit: 'kg',
      quantity: 2,
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.01,
    })

    const [reference] = buildComparison(current(12), [previous], now)

    assert.equal(reference.observation?.quantity, 2)
    assert.equal(reference.observation?.unit, 'kg')
  })

  it('ignora registros posteriores ao preço atual', () => {
    const future = observation({
      id: 'future',
      purchasedAt: '2026-11-20T12:00:00.000Z',
      unitPrice: 5,
      unit: 'kg',
      normalizedUnit: 'g',
      normalizedUnitPrice: 0.005,
    })

    const [reference] = buildComparison(current(12), [future], now)

    assert.equal(reference.observation, null)
  })
})
