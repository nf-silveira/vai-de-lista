import { useState, type FormEvent } from 'react'
import type { NewShoppingItem } from '../../../../../shared/shopping-list'
import styles from './ShoppingItemForm.module.css'

interface ShoppingItemFormProps {
  onSubmit: (item: NewShoppingItem) => Promise<boolean>
  isSubmitting: boolean
}

export function ShoppingItemForm({
  onSubmit,
  isSubmitting,
}: ShoppingItemFormProps) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      setValidationMessage('Informe o nome do produto.')
      return
    }

    const parsedQuantity = Number(quantity.replace(',', '.'))
    const parsedPrice = unitPrice === '' ? null : Number(unitPrice.replace(',', '.'))

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setValidationMessage('A quantidade deve ser maior que zero.')
      return
    }

    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setValidationMessage('O preço não pode ser negativo.')
      return
    }

    setValidationMessage(null)

    const created = await onSubmit({
      name: trimmedName,
      quantity: parsedQuantity,
      unitPrice: parsedPrice,
    })

    if (!created) return

    setName('')
    setQuantity('1')
    setUnitPrice('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.nameField}>
        <label className="form-label" htmlFor="item-name">
          Produto
        </label>
        <input
          id="item-name"
          className="form-control"
          placeholder="Ex.: Leite integral"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
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
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
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
