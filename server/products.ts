import type { ItemUnit } from '../shared/shopping-list.js'

export interface NormalizedPrice {
  unit: string | null
  price: number | null
}

interface BaseUnit {
  unit: string
  factor: number
}

/**
 * Só converte quando a equivalência é conhecida: peso em gramas, volume em
 * mililitros e contagem em unidades. Caixa não revela o conteúdo, então fica
 * sem normalização para não gerar comparação falsa.
 */
const BASE_UNITS: Partial<Record<ItemUnit, BaseUnit>> = {
  g: { unit: 'g', factor: 1 },
  kg: { unit: 'g', factor: 1000 },
  ml: { unit: 'ml', factor: 1 },
  l: { unit: 'ml', factor: 1000 },
  un: { unit: 'un', factor: 1 },
}

/** Chave de produto usada no histórico: sem acento, caixa ou espaço extra. */
export function normalizeProductKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Fator que converte a unidade para a base usada na comparação. */
export function normalizeFactor(unit: ItemUnit): number | null {
  return BASE_UNITS[unit]?.factor ?? null
}

export function normalizePrice(
  unit: ItemUnit,
  unitPrice: number | null,
): NormalizedPrice {
  if (unitPrice === null) {
    return { unit: null, price: null }
  }

  const base = BASE_UNITS[unit]

  if (!base) {
    return { unit: null, price: null }
  }

  return { unit: base.unit, price: unitPrice / base.factor }
}
