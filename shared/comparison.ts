import type { ItemUnit } from './shopping-list.js'

export type ComparisonPeriod = 'previous' | 'last7Days' | 'previousMonth'

/** Observação de preço vinda de uma compra finalizada. */
export interface PriceObservation {
  id: string
  productName: string
  quantity: number
  unit: ItemUnit
  unitPrice: number
  normalizedUnit: string | null
  normalizedUnitPrice: number | null
  purchasedAt: string
}

/**
 * Comparação do preço mais recente contra uma referência. Quando as unidades
 * não são compatíveis, `comparable` é falso e `note` explica o motivo.
 */
export interface ComparisonReference {
  period: ComparisonPeriod
  observation: PriceObservation | null
  comparable: boolean
  basisUnit: ItemUnit | null
  currentPrice: number | null
  referencePrice: number | null
  difference: number | null
  percentage: number | null
  note: string | null
}

export interface ProductComparison {
  productKey: string
  productName: string
  current: PriceObservation
  references: ComparisonReference[]
}

export interface ProductOption {
  productKey: string
  productName: string
  observationCount: number
  lastPurchasedAt: string
}
