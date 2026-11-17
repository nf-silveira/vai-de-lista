import { useState, type FormEvent } from 'react'
import {
  ITEM_UNITS,
  type ItemUnit,
  type ShoppingItem,
  type ShoppingItemPatch,
} from '../../../../../shared/shopping-list'
import { createItemDraft, parseItemDraft } from '../../utils/itemDraft'
import styles from './ShoppingItemEditor.module.css'

interface ShoppingItemEditorProps {
  item: ShoppingItem
  isBusy: boolean
  onCancel: () => void
  onSave: (patch: ShoppingItemPatch) => Promise<boolean>
}

export function ShoppingItemEditor({
  item,
  isBusy,
  onCancel,
  onSave,
}: ShoppingItemEditorProps) {
  const [draft, setDraft] = useState(() => createItemDraft(item))
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = parseItemDraft(draft)

    if (!parsed.ok) {
      setValidationMessage(parsed.message)
      return
    }

    setValidationMessage(null)

    const saved = await onSave(parsed.value)

    if (saved) {
      onCancel()
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor={`edit-name-${item.id}`}>
          Produto
        </label>
        <input
          id={`edit-name-${item.id}`}
          className="form-control"
          value={draft.name}
          maxLength={80}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
        />
      </div>

      <div className={styles.numericFields}>
        <div>
          <label className="form-label" htmlFor={`edit-quantity-${item.id}`}>
            Qtd.
          </label>
          <input
            id={`edit-quantity-${item.id}`}
            className="form-control"
            inputMode="decimal"
            value={draft.quantity}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                quantity: event.target.value,
              }))
            }
          />
        </div>

        <div>
          <label className="form-label" htmlFor={`edit-unit-${item.id}`}>
            Unidade
          </label>
          <select
            id={`edit-unit-${item.id}`}
            className="form-select"
            value={draft.unit}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                unit: event.target.value as ItemUnit,
              }))
            }
          >
            {ITEM_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor={`edit-price-${item.id}`}>
          Preço un. (R$)
        </label>
        <input
          id={`edit-price-${item.id}`}
          className="form-control"
          inputMode="decimal"
          placeholder="Opcional"
          value={draft.unitPrice}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              unitPrice: event.target.value,
            }))
          }
        />
      </div>

      {validationMessage && (
        <p className={styles.validation} role="alert">
          {validationMessage}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onCancel}
          disabled={isBusy}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isBusy}
        >
          {isBusy ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
