import { LoadingState } from '../../../components/LoadingState/LoadingState'
import { ShoppingItemForm } from '../components/ShoppingItemForm/ShoppingItemForm'
import { ShoppingItemRow } from '../components/ShoppingItemRow/ShoppingItemRow'
import { useShoppingItems } from '../hooks/useShoppingItems'
import { formatCurrency, summarizeItems } from '../utils/summarizeItems'
import styles from './ShoppingListPage.module.css'

export function ShoppingListPage() {
  const {
    items,
    status,
    errorMessage,
    isAdding,
    busyItemId,
    addItem,
    updateItem,
    toggleItem,
    removeItem,
  } = useShoppingItems()

  if (status === 'loading') {
    return <LoadingState message="Carregando a lista..." />
  }

  const summary = summarizeItems(items)
  const checkedSuffix =
    summary.checkedCount > 0 ? ` · ${summary.checkedCount} comprado(s)` : ''

  return (
    <section className={styles.page}>
      <div className={`card ${styles.summary}`}>
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
    </section>
  )
}
