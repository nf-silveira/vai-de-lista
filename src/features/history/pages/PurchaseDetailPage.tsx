import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { LoadingState } from '../../../components/LoadingState/LoadingState'
import { describeApiError } from '../../../lib/apiError'
import {
  formatCurrency,
  formatDateTime,
  formatQuantity,
} from '../../../lib/format'
import { usePurchase } from '../hooks/usePurchase'
import { historyApi } from '../services/historyApi'
import styles from './PurchaseDetailPage.module.css'

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { purchase, status, errorMessage, reload } = usePurchase(id)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!id) {
    return <Navigate to="/historico" replace />
  }

  if (status === 'loading') {
    return <LoadingState message="Carregando a compra..." />
  }

  if (status === 'error' || !purchase) {
    return (
      <section className={styles.page}>
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{errorMessage}</p>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>
        </div>
        <Link to="/historico">Voltar ao histórico</Link>
      </section>
    )
  }

  async function handleDelete() {
    if (!purchase) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await historyApi.remove(purchase.id)
      navigate('/historico', { replace: true })
    } catch (error: unknown) {
      setDeleteError(
        describeApiError(error, 'Não foi possível excluir a compra.'),
      )
      setIsDeleting(false)
    }
  }

  return (
    <section className={styles.page}>
      <Link to="/historico" className={styles.back}>
        ← Histórico
      </Link>

      <header className={styles.header}>
        <h2 className={styles.title}>{purchase.name}</h2>
        <p className={styles.date}>
          {formatDateTime(purchase.purchasedAt)}
        </p>
      </header>

      <div className={`card ${styles.summary}`}>
        <div className="card-body">
          <p className={styles.summaryLabel}>Total da compra</p>
          <p className={styles.summaryValue}>
            {formatCurrency(purchase.total)}
          </p>
          <p className={styles.summaryHint}>
            {purchase.itemCount} item(ns)
            {purchase.itemsWithoutPrice > 0 &&
              ` · ${purchase.itemsWithoutPrice} sem preço`}
          </p>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Itens registrados</h3>
      <ul className={`list-group ${styles.list}`}>
        {purchase.items.map((item) => (
          <li key={item.id} className="list-group-item">
            <div className={styles.item}>
              <div>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemDetails}>
                  {formatQuantity(item.quantity)} {item.unit}
                  {item.unitPrice === null
                    ? ' · sem preço'
                    : ` × ${formatCurrency(item.unitPrice)}`}
                </p>
              </div>
              <span className={styles.subtotal}>
                {item.unitPrice === null
                  ? '—'
                  : formatCurrency(item.quantity * item.unitPrice)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {deleteError && (
        <div className="alert alert-danger py-2" role="alert">
          {deleteError}
        </div>
      )}

      <div className={styles.dangerZone}>
        {isConfirmingDelete ? (
          <div role="group" aria-label="Confirmar exclusão da compra">
            <p className={styles.confirmText}>
              Excluir esta compra do histórico? Os registros de preço usados na
              comparação continuam guardados.
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir compra'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => setIsConfirmingDelete(true)}
          >
            Excluir compra
          </button>
        )}
      </div>
    </section>
  )
}
