import { useState, type FormEvent } from 'react'
import {
  ITEM_UNITS,
  type ItemUnit,
  type NewShoppingItem,
} from '../../../../../shared/shopping-list'
import { createItemDraft, parseItemDraft } from '../../utils/itemDraft'
import styles from './ShoppingItemForm.module.css'

interface ShoppingItemFormProps {
  onSubmit: (item: NewShoppingItem) => Promise<boolean>
  isSubmitting: boolean
}

export function ShoppingItemForm({
  onSubmit,
  isSubmitting,
}: ShoppingItemFormProps) {
  const [draft, setDraft] = useState(() => createItemDraft())
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = parseItemDraft(draft)

    if (!parsed.ok) {
      setValidationMessage(parsed.message)
      return
    }

    setValidationMessage(null)

    const created = await onSubmit(parsed.value)

    if (!created) return

    setDraft(createItemDraft())
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="item-name">
          Produto
        </label>
        <input
          id="item-name"
          className="form-control"
          placeholder="Ex.: Leite integral"
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          maxLength={80}
        />
      </div>

      <div className={styles.numericFields}>
        <div>
          <label className="form-label" htmlFor="item-quantity">
            Qtd.
          </label>
          <input
            id="item-quantity"
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
          <label className="form-label" htmlFor="item-unit">
            Un.
          </label>
          <select
            id="item-unit"
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

        <div>
          <label className="form-label" htmlFor="item-price">
            Preço un. (R$)
          </label>
          <input
            id="item-price"
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
      </div>

      {validationMessage && (
        <p className={styles.validation} role="alert">
          {validationMessage}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Adicionando...' : 'Adicionar item'}
      </button>
    </form>
  )
}
