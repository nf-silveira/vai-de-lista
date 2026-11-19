export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Preço unitário: mantém centavos e também frações de centavo (R$/g, R$/ml). */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(
    quantity,
  )
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatPercentage(value: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  }).format(value)

  return `${formatted}%`
}
