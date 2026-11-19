import { useState } from 'react'
import { formatCurrency } from '../../utils/summarizeItems'
import styles from './FinalizePurchaseCard.module.css'

interface FinalizePurchaseCardProps {
  itemCount: number
  total: number
  itemsWithoutPrice: number
  isFinishing: boolean
  onConfirm: () => Promise<void>
}

export function FinalizePurchaseCard({
  itemCount,
  total,
  itemsWithoutPrice,
  isFinishing,
  onConfirm,
}: FinalizePurchaseCardProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  if (!isConfirming) {
    return (
      <button
        type="button"
        className={`btn btn-primary w-100 ${styles.button}`}
        onClick={() => setIsConfirming(true)}
      >
        Finalizar compra
      </button>
    )
  }

  return (
    <div className={`card ${styles.card}`} role="group" aria-label="Confirmar finalização">
      <div className="card-body">
        <p className={styles.question}>Finalizar esta compra?</p>
        <p className={styles.summary}>
          {itemCount} item(ns) · {formatCurrency(total)}
        </p>
        {itemsWithoutPrice > 0 && (
          <p className={styles.warning}>
            {itemsWithoutPrice} item(ns) sem preço ficam guardados no histórico,
            mas não geram registro de preço.
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setIsConfirming(false)}
            disabled={isFinishing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void onConfirm()}
            disabled={isFinishing}
          >
            {isFinishing ? 'Finalizando...' : 'Finalizar compra'}
          </button>
        </div>
      </div>
    </div>
  )
}
