import type {
  ProductComparison,
  ProductOption,
} from '../../../../shared/comparison'
import { apiRequest } from '../../../lib/apiRequest'

interface ProductsResponse {
  products: ProductOption[]
}

interface ComparisonResponse {
  comparison: ProductComparison
}

export const comparisonApi = {
  async list(search: string): Promise<ProductOption[]> {
    const query = new URLSearchParams({ search })
    const { products } = await apiRequest<ProductsResponse>(
      `/api/products?${query.toString()}`,
    )
    return products
  },

  async get(productKey: string): Promise<ProductComparison> {
    const query = new URLSearchParams({ productKey })
    const { comparison } = await apiRequest<ComparisonResponse>(
      `/api/comparisons?${query.toString()}`,
    )
    return comparison
  },
}
