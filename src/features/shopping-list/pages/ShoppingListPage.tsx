import { useNavigate } from 'react-router-dom'
import { LoadingState } from '../../../components/LoadingState/LoadingState'
import { FinalizePurchaseCard } from '../components/FinalizePurchaseCard/FinalizePurchaseCard'
import { ShoppingItemForm } from '../components/ShoppingItemForm/ShoppingItemForm'
import { ShoppingItemRow } from '../components/ShoppingItemRow/ShoppingItemRow'
import { useShoppingItems } from '../hooks/useShoppingItems'
import { formatCurrency } from '../../../lib/format'
import { summarizeItems } from '../utils/summarizeItems'
import styles from './ShoppingListPage.module.css'

export function ShoppingListPage() {
  const navigate = useNavigate()
  const {
    items,
    status,
    errorMessage,
    isAdding,
    isFinishing,
    busyItemId,
    reload,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
    finalize,
  } = useShoppingItems()

  if (status === 'loading') {
    return <LoadingState message="Carregando a lista..." />
  }

  // Sem isso, uma falha de rede na primeira carga apareceria como lista vazia.
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

  const summary = summarizeItems(items)
  const checkedSuffix =
    summary.checkedCount > 0 ? ` · ${summary.checkedCount} comprado(s)` : ''

  return (
    <section className={styles.page}>
      <div className={`card ${styles.summary}`} aria-live="polite">
        <div className="card-body">
          <p className={styles.summaryLabel}>Total parcial</p>
          <p className={styles.summaryValue}>{formatCurrency(summary.total)}</p>
          <p className={styles.summaryHint}>
            {items.length} item(ns) na lista{checkedSuffix}
          </p>
          {summary.itemsWithoutPrice > 0 && (
            <p className={styles.summaryWarning}>
              {summary.itemsWithoutPrice} item(ns) sem preço — o total pode
              aumentar.
            </p>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger py-2" role="alert">
          {errorMessage}
        </div>
      )}

      <div className={`card ${styles.formCard}`}>
        <div className="card-body">
          <h2 className={styles.sectionTitle}>Adicionar produto</h2>
          <ShoppingItemForm onSubmit={addItem} isSubmitting={isAdding} />
        </div>
      </div>

      <div className={styles.listSection}>
        <h2 className={styles.sectionTitle}>Sua lista</h2>

        {items.length === 0 ? (
          <p className={styles.empty}>
            Nenhum item ainda. Adicione o primeiro produto para começar.
          </p>
        ) : (
          <ul className={`list-group ${styles.list}`}>
            {items.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={toggleItem}
                onUpdate={updateItem}
                onRemove={removeItem}
                isBusy={busyItemId === item.id}
              />
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <FinalizePurchaseCard
          itemCount={items.length}
          total={summary.total}
          itemsWithoutPrice={summary.itemsWithoutPrice}
          isFinishing={isFinishing}
          onConfirm={async () => {
            const purchase = await finalize()

            if (purchase) {
              navigate(`/historico/${purchase.id}`)
            }
          }}
        />
      )}
    </section>
  )
}
