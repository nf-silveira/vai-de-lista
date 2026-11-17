import type { ShoppingItem } from '../../../../../shared/shopping-list'
import {
  formatCurrency,
  formatQuantity,
} from '../../utils/summarizeItems'
import styles from './ShoppingItemRow.module.css'

interface ShoppingItemRowProps {
  item: ShoppingItem
  onToggle: (item: ShoppingItem) => void
  onRemove: (item: ShoppingItem) => void
  isBusy: boolean
}

export function ShoppingItemRow({
  item,
  onToggle,
  onRemove,
  isBusy,
}: ShoppingItemRowProps) {
  const details =
    item.unitPrice === null
      ? `${formatQuantity(item.quantity)} un · sem preço`
      : `${formatQuantity(item.quantity)} un × ${formatCurrency(item.unitPrice)}`

  return (
    <li
      className={`list-group-item d-flex align-items-center gap-2 ${styles.row} ${
        item.isChecked ? styles.checked : ''
      }`}
    >
      <div className="form-check d-flex align-items-center gap-2 flex-grow-1 mb-0">
        <input
          id={`item-${item.id}`}
          className="form-check-input mt-0"
          type="checkbox"
          checked={item.isChecked}
          onChange={() => onToggle(item)}
          disabled={isBusy}
        />
        <label htmlFor={`item-${item.id}`} className={styles.label}>
          <span className={styles.name}>{item.name}</span>
          <span className={styles.details}>{details}</span>
        </label>
      </div>

      <span className={styles.subtotal}>
        {item.unitPrice === null
          ? '—'
          : formatCurrency(item.quantity * item.unitPrice)}
      </span>

      <button
        type="button"
        className={styles.removeButton}
        onClick={() => onRemove(item)}
        disabled={isBusy}
        aria-label={`Remover ${item.name}`}
      >
        ×
      </button>
    </li>
  )
}
