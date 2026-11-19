import { useState } from 'react'
import type {
  ShoppingItem,
  ShoppingItemPatch,
} from '../../../../../shared/shopping-list'
import { formatCurrency, formatQuantity } from '../../../../lib/format'
import { ShoppingItemEditor } from '../ShoppingItemEditor/ShoppingItemEditor'
import styles from './ShoppingItemRow.module.css'

interface ShoppingItemRowProps {
  item: ShoppingItem
  onToggle: (item: ShoppingItem) => void
  onUpdate: (item: ShoppingItem, patch: ShoppingItemPatch) => Promise<boolean>
  onRemove: (item: ShoppingItem) => void
  isBusy: boolean
}

export function ShoppingItemRow({
  item,
  onToggle,
  onUpdate,
  onRemove,
  isBusy,
}: ShoppingItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false)

  const details =
    item.unitPrice === null
      ? `${formatQuantity(item.quantity)} ${item.unit} · sem preço`
      : `${formatQuantity(item.quantity)} ${item.unit} × ${formatCurrency(item.unitPrice)}`

  if (isEditing) {
    return (
      <li className={`list-group-item ${styles.row}`}>
        <ShoppingItemEditor
          item={item}
          isBusy={isBusy}
          onCancel={() => setIsEditing(false)}
          onSave={(patch) => onUpdate(item, patch)}
        />
      </li>
    )
  }

  function handleConfirmRemove() {
    setIsConfirmingRemove(false)
    onRemove(item)
  }

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

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => setIsEditing(true)}
          disabled={isBusy}
          aria-label={`Editar ${item.name}`}
        >
          Editar
        </button>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => setIsConfirmingRemove(true)}
          disabled={isBusy}
          aria-label={`Remover ${item.name}`}
        >
          ×
        </button>
      </div>

      {isConfirmingRemove && (
        <div className={styles.confirmBar} role="group" aria-label="Confirmar remoção">
          <span className={styles.confirmText}>Remover {item.name}?</span>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={handleConfirmRemove}
            disabled={isBusy}
          >
            Remover
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setIsConfirmingRemove(false)}
            disabled={isBusy}
          >
            Cancelar
          </button>
        </div>
      )}
    </li>
  )
}
