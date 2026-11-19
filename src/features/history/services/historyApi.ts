import type {
  PurchaseDetail,
  PurchaseSummary,
} from '../../../../shared/shopping-list'
import { apiRequest } from '../../../lib/apiRequest'

interface PurchasesResponse {
  purchases: PurchaseSummary[]
}

interface PurchaseResponse {
  purchase: PurchaseDetail
}

export const historyApi = {
  async list(): Promise<PurchaseSummary[]> {
    const { purchases } = await apiRequest<PurchasesResponse>('/api/purchases')
    return purchases
  },

  async get(id: string): Promise<PurchaseDetail> {
    const { purchase } = await apiRequest<PurchaseResponse>(
      `/api/purchases/${id}`,
    )
    return purchase
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/api/purchases/${id}`, { method: 'DELETE' })
  },
}
