import styles from './PlaceholderPage.module.css'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className={styles.page}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      <span className="badge text-bg-light">Em breve</span>
    </section>
  )
}
