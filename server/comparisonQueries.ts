import type {
  PriceObservation,
  ProductComparison,
  ProductOption,
} from '../shared/comparison.js'
import type { ItemUnit } from '../shared/shopping-list.js'
import { query } from './db.js'
import { buildComparison } from './priceComparison.js'
import { normalizeProductKey } from './products.js'

interface PriceRow {
  id: string
  product_name: string
  quantity: string
  unit: ItemUnit
  unit_price: string
  normalized_unit: string | null
  normalized_unit_price: string | null
  purchased_at: Date
}

interface ProductRow {
  product_key: string
  product_name: string
  last_purchased_at: Date
  observation_count: number
}

function toObservation(row: PriceRow): PriceObservation {
  return {
    id: row.id,
    productName: row.product_name,
    quantity: Number(row.quantity),
    unit: row.unit,
    unitPrice: Number(row.unit_price),
    normalizedUnit: row.normalized_unit,
    normalizedUnitPrice:
      row.normalized_unit_price === null
        ? null
        : Number(row.normalized_unit_price),
    purchasedAt: row.purchased_at.toISOString(),
  }
}

export async function listProducts(search: string): Promise<ProductOption[]> {
  const normalizedSearch = normalizeProductKey(search)

  const rows = await query<ProductRow>(
    `select latest.product_key,
            latest.product_name,
            latest.purchased_at as last_purchased_at,
            counts.observation_count
       from (select distinct on (product_key)
                    product_key, product_name, purchased_at
               from price_records
              order by product_key, purchased_at desc) latest
       join (select product_key, count(*)::int as observation_count
               from price_records
              group by product_key) counts using (product_key)
      where $1 = '' or latest.product_key like '%' || $1 || '%'
      order by latest.purchased_at desc
      limit 50`,
    [normalizedSearch],
  )

  return rows.map((row) => ({
    productKey: row.product_key,
    productName: row.product_name,
    observationCount: row.observation_count,
    lastPurchasedAt: row.last_purchased_at.toISOString(),
  }))
}

export async function getComparison(
  productKey: string,
): Promise<ProductComparison | null> {
  const rows = await query<PriceRow>(
    `select id, product_name, quantity, unit, unit_price,
            normalized_unit, normalized_unit_price, purchased_at
       from price_records
      where product_key = $1
      order by purchased_at desc, created_at desc`,
    [productKey],
  )

  const [currentRow, ...historyRows] = rows

  if (!currentRow) return null

  const current = toObservation(currentRow)
  const history = historyRows.map(toObservation)

  return {
    productKey,
    productName: current.productName,
    current,
    references: buildComparison(current, history, new Date()),
  }
}
