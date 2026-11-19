import type {
  ComparisonPeriod,
  ComparisonReference,
  PriceObservation,
} from '../shared/comparison.js'
import type { ItemUnit } from '../shared/shopping-list.js'
import { normalizeFactor } from './products.js'

const DAY_MS = 24 * 60 * 60 * 1000

interface ComparisonResult {
  comparable: boolean
  basisUnit: ItemUnit | null
  currentPrice: number | null
  referencePrice: number | null
  difference: number | null
  percentage: number | null
  note: string | null
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function buildPrices(
  basisUnit: ItemUnit,
  currentPrice: number,
  referencePrice: number,
): ComparisonResult {
  const roundedCurrent = round(currentPrice, 4)
  const roundedReference = round(referencePrice, 4)
  const difference = round(roundedCurrent - roundedReference, 4)

  return {
    comparable: true,
    basisUnit,
    currentPrice: roundedCurrent,
    referencePrice: roundedReference,
    difference,
    percentage:
      roundedReference > 0
        ? round((difference / roundedReference) * 100, 2)
        : null,
    note:
      roundedReference === 0
        ? 'O preço anterior era zero; não é possível calcular percentual.'
        : null,
  }
}

function compareObservation(
  current: PriceObservation,
  reference: PriceObservation,
): ComparisonResult {
  if (current.unit === reference.unit) {
    return buildPrices(current.unit, current.unitPrice, reference.unitPrice)
  }

  const sameNormalizedUnit =
    current.normalizedUnit !== null &&
    current.normalizedUnit === reference.normalizedUnit
  const referenceNormalizedPrice = reference.normalizedUnitPrice
  const factor = normalizeFactor(current.unit)

  if (
    sameNormalizedUnit &&
    referenceNormalizedPrice !== null &&
    factor !== null
  ) {
    return buildPrices(
      current.unit,
      current.unitPrice,
      referenceNormalizedPrice * factor,
    )
  }

  return {
    comparable: false,
    basisUnit: null,
    currentPrice: null,
    referencePrice: null,
    difference: null,
    percentage: null,
    note: `Não foi possível comparar: unidades diferentes (${current.unit} e ${reference.unit}).`,
  }
}

function previousMonthRange(current: Date): { start: number; end: number } {
  const startOfCurrentMonth = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    1,
  )
  const start = Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth() - 1,
    1,
  )

  return { start, end: startOfCurrentMonth }
}

function mostRecentBefore(
  observations: PriceObservation[],
  currentTime: number,
  predicate: (time: number) => boolean,
): PriceObservation | null {
  return (
    observations.find((observation) => {
      const time = Date.parse(observation.purchasedAt)
      return time < currentTime && predicate(time)
    }) ?? null
  )
}

function reference(
  period: ComparisonPeriod,
  observation: PriceObservation | null,
  current: PriceObservation,
  missingNote: string,
): ComparisonReference {
  if (!observation) {
    return {
      period,
      observation: null,
      comparable: false,
      basisUnit: null,
      currentPrice: null,
      referencePrice: null,
      difference: null,
      percentage: null,
      note: missingNote,
    }
  }

  return {
    period,
    observation,
    ...compareObservation(current, observation),
  }
}

/**
 * Referências sempre anteriores ao preço atual. Para as janelas, usa a
 * observação mais recente dentro do período; nunca calcula média nem inventa
 * valores.
 */
export function buildComparison(
  current: PriceObservation,
  history: PriceObservation[],
  now: Date,
): ComparisonReference[] {
  const currentTime = Date.parse(current.purchasedAt)
  const previousObservations = history
    .filter((observation) => observation.id !== current.id)
    .sort((a, b) => Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt))

  const previous = previousObservations.find(
    (observation) => Date.parse(observation.purchasedAt) < currentTime,
  )

  const windowStart = now.getTime() - 7 * DAY_MS
  const last7Days = mostRecentBefore(
    previousObservations,
    currentTime,
    (time) => time >= windowStart && time <= now.getTime(),
  )

  const previousMonth = previousMonthRange(new Date(currentTime))
  const previousMonthObservation = mostRecentBefore(
    previousObservations,
    currentTime,
    (time) => time >= previousMonth.start && time < previousMonth.end,
  )

  return [
    reference(
      'previous',
      previous ?? null,
      current,
      previousObservations.length === 0
        ? 'Primeira vez que você registra este produto.'
        : 'Não há compra anterior a este registro.',
    ),
    reference(
      'last7Days',
      last7Days,
      current,
      'Não há registro nos últimos 7 dias.',
    ),
    reference(
      'previousMonth',
      previousMonthObservation,
      current,
      'Não há registro no mês anterior.',
    ),
  ]
}
