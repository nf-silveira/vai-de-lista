import { Link } from 'react-router-dom'
import { LoadingState } from '../../../components/LoadingState/LoadingState'
import { formatCurrency, formatDateTime } from '../../../lib/format'
import { usePurchases } from '../hooks/usePurchases'
import styles from './HistoryPage.module.css'

export function HistoryPage() {
  const { purchases, status, errorMessage, reload } = usePurchases()

  if (status === 'loading') {
    return <LoadingState message="Carregando o histórico..." />
  }

  if (status === 'error') {
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
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Histórico</h2>
        <p className={styles.hint}>
          Cada compra finalizada fica guardada com os preços do dia.
        </p>
      </header>

      {purchases.length === 0 ? (
        <p className={styles.empty}>
          Nenhuma compra finalizada ainda. Finalize a lista para ver a compra
          aqui.
        </p>
      ) : (
        <ul className={`list-group ${styles.list}`}>
          {purchases.map((purchase) => (
            <li key={purchase.id} className="list-group-item p-0">
              <Link
                to={`/historico/${purchase.id}`}
                className={styles.card}
                aria-label={`Ver compra de ${formatDateTime(purchase.purchasedAt)}`}
              >
                <span className={styles.date}>
                  {formatDateTime(purchase.purchasedAt)}
                </span>
                <span className={styles.name}>{purchase.name}</span>
                <span className={styles.meta}>
                  {purchase.itemCount} item(ns) ·{' '}
                  {formatCurrency(purchase.total)}
                  {purchase.itemsWithoutPrice > 0 &&
                    ` · ${purchase.itemsWithoutPrice} sem preço`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
