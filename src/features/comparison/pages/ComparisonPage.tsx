import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  ComparisonPeriod,
  ComparisonReference,
} from '../../../../shared/comparison'
import { LoadingState } from '../../../components/LoadingState/LoadingState'
import {
  formatDateTime,
  formatPercentage,
  formatPrice,
  formatQuantity,
} from '../../../lib/format'
import { useComparison } from '../hooks/useComparison'
import { useProductSearch } from '../hooks/useProductSearch'
import styles from './ComparisonPage.module.css'

const PERIOD_TITLES: Record<ComparisonPeriod, string> = {
  previous: 'Compra anterior',
  last7Days: 'Últimos 7 dias',
  previousMonth: 'Mês anterior',
}

function ReferenceCard({ reference }: { reference: ComparisonReference }) {
  const title = PERIOD_TITLES[reference.period]
  const observation = reference.observation

  if (!observation) {
    return (
      <div className={styles.reference}>
        <p className={styles.referenceTitle}>{title}</p>
        <p className={styles.referenceNote}>{reference.note}</p>
      </div>
    )
  }

  const basisUnit = reference.basisUnit
  const referencePrice = reference.referencePrice
  const difference = reference.difference
  const showEquivalent =
    reference.comparable &&
    basisUnit !== null &&
    basisUnit !== observation.unit &&
    referencePrice !== null

  return (
    <div className={styles.reference}>
      <p className={styles.referenceTitle}>{title}</p>
      <p className={styles.referenceDate}>
        {formatDateTime(observation.purchasedAt)}
      </p>
      <p className={styles.referencePrice}>
        {formatQuantity(observation.quantity)} {observation.unit} ×{' '}
        {formatPrice(observation.unitPrice)}/{observation.unit}
      </p>

      {showEquivalent && referencePrice !== null && basisUnit !== null && (
        <p className={styles.referenceEquivalent}>
          Equivale a {formatPrice(referencePrice)}/{basisUnit}
        </p>
      )}

      {!reference.comparable && (
        <p className={styles.referenceWarning}>{reference.note}</p>
      )}

      {reference.comparable && difference !== null && (
        <p
          className={`${styles.variation} ${
            difference > 0
              ? styles.expensive
              : difference < 0
                ? styles.cheaper
                : styles.same
          }`}
        >
          {difference === 0
            ? 'Mesmo preço'
            : `${formatPrice(Math.abs(difference))} ${
                difference > 0 ? 'mais caro' : 'mais barato'
              }`}
          {reference.percentage !== null &&
            ` (${formatPercentage(reference.percentage)})`}
        </p>
      )}

      {reference.comparable && reference.note && (
        <p className={styles.referenceNote}>{reference.note}</p>
      )}
    </div>
  )
}

export function ComparisonPage() {
  const [params, setParams] = useSearchParams()
  const selectedKey = params.get('produto')
  const { search, setSearch, products, status, errorMessage } =
    useProductSearch()
  const {
    comparison,
    isLoading,
    isError,
    errorMessage: comparisonError,
    reload,
  } = useComparison(selectedKey)
  const resultRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!comparison) return
    resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [comparison])

  function handleSelect(productKey: string) {
    setParams({ produto: productKey })
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles.title}>Comparar preços</h2>
        <p className={styles.hint}>
          Compare o preço mais recente com compras anteriores e veja a
          diferença em reais e percentual.
        </p>
      </header>

      <div>
        <label className="form-label" htmlFor="product-search">
          Produto
        </label>
        <input
          id="product-search"
          type="search"
          className="form-control"
          placeholder="Ex.: leite"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {status === 'error' && (
        <div className="alert alert-danger py-2" role="alert">
          {errorMessage}
        </div>
      )}

      {products.length > 0 && (
        <ul className={styles.options}>
          {products.map((product) => {
            const isSelected = product.productKey === selectedKey

            return (
              <li key={product.productKey}>
                <button
                  type="button"
                  className={
                    isSelected
                      ? `${styles.option} ${styles.optionActive}`
                      : styles.option
                  }
                  aria-pressed={isSelected}
                  onClick={() => handleSelect(product.productKey)}
                >
                  <span className={styles.optionName}>
                    {product.productName}
                  </span>
                  <span className={styles.optionMeta}>
                    {product.observationCount} registro(s) · última compra em{' '}
                    {formatDateTime(product.lastPurchasedAt)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {status === 'ready' && products.length === 0 && (
        <p className={styles.empty}>
          Nenhum produto com preço registrado ainda. Finalize uma compra para
          começar a comparar.
        </p>
      )}

      {!selectedKey && products.length > 0 && (
        <p className={styles.hint}>
          Escolha um produto para ver as comparações.
        </p>
      )}

      {selectedKey && isLoading && (
        <LoadingState message="Comparando preços..." />
      )}

      {selectedKey && isError && (
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{comparisonError}</p>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={reload}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {comparison && !isLoading && (
        <article className={styles.result} ref={resultRef} aria-live="polite">
          <header className={styles.resultHeader}>
            <h3 className={styles.resultTitle}>{comparison.productName}</h3>
            <p className={styles.current}>
              Preço mais recente:{' '}
              <strong>
                {formatPrice(comparison.current.unitPrice)}/
                {comparison.current.unit}
              </strong>
            </p>
            <p className={styles.currentMeta}>
              {formatQuantity(comparison.current.quantity)}{' '}
              {comparison.current.unit} ·{' '}
              {formatDateTime(comparison.current.purchasedAt)}
            </p>
          </header>

          <ul className={styles.references}>
            {comparison.references.map((reference) => (
              <li key={reference.period}>
                <ReferenceCard reference={reference} />
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  )
}
