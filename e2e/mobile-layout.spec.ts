import { expect, test, type Page } from '@playwright/test'
import type { AccountSummary } from '../shared/account'
import type {
  ProductComparison,
  ProductOption,
} from '../shared/comparison'
import type {
  PurchaseDetail,
  PurchaseSummary,
  ShoppingItem,
} from '../shared/shopping-list'

const WIDTHS = [320, 360, 390, 430]
const HEIGHT = 900

const account: AccountSummary = {
  id: 'account-ana',
  name: 'Ana Silva',
  username: 'ana',
  email: 'ana.silva@exemplo.com.br',
  role: 'admin',
  status: 'active',
  createdAt: '2026-01-10T12:00:00.000Z',
}

const otherAccounts: AccountSummary[] = [
  {
    id: 'account-bruno',
    name: 'Bruno Carvalho',
    username: 'bruno',
    email: 'bruno.carvalho@exemplo.com.br',
    role: 'user',
    status: 'pending',
    createdAt: '2026-11-18T12:00:00.000Z',
  },
  {
    id: 'account-carla',
    name: 'Carla Mendes',
    username: null,
    email: 'carla.mendes.compras@exemplo.com.br',
    role: 'user',
    status: 'banned',
    createdAt: '2026-10-02T12:00:00.000Z',
  },
]

const items: ShoppingItem[] = [
  {
    id: 'item-leite',
    name: 'Leite integral longa vida 1 L',
    quantity: 6,
    unit: 'un',
    unitPrice: 5.49,
    isChecked: false,
    createdAt: '2026-11-19T10:00:00.000Z',
  },
  {
    id: 'item-arroz',
    name: 'Arroz branco tipo 1 pacote de 5 kg',
    quantity: 1,
    unit: 'un',
    unitPrice: 28.9,
    isChecked: false,
    createdAt: '2026-11-19T10:01:00.000Z',
  },
  {
    id: 'item-banana',
    name: 'Banana prata',
    quantity: 1.2,
    unit: 'kg',
    unitPrice: 7.99,
    isChecked: true,
    createdAt: '2026-11-19T10:02:00.000Z',
  },
  {
    id: 'item-detergente',
    name: 'Detergente neutro concentrado 500 ml',
    quantity: 3,
    unit: 'un',
    unitPrice: null,
    isChecked: false,
    createdAt: '2026-11-19T10:03:00.000Z',
  },
]

const purchases: PurchaseSummary[] = [
  {
    id: 'purchase-1',
    name: 'Compra do mercado',
    itemCount: 4,
    itemsWithoutPrice: 1,
    total: 84.37,
    purchasedAt: '2026-11-18T18:30:00.000Z',
  },
  {
    id: 'purchase-2',
    name: 'Feira da semana',
    itemCount: 2,
    itemsWithoutPrice: 0,
    total: 31.5,
    purchasedAt: '2026-11-12T09:15:00.000Z',
  },
]

const purchase: PurchaseDetail = {
  ...purchases[0],
  items,
}

const products: ProductOption[] = [
  {
    productKey: 'leite-integral',
    productName: 'Leite integral',
    observationCount: 3,
    lastPurchasedAt: '2026-11-18T18:30:00.000Z',
  },
  {
    productKey: 'arroz-branco',
    productName: 'Arroz branco',
    observationCount: 2,
    lastPurchasedAt: '2026-11-12T09:15:00.000Z',
  },
  {
    productKey: 'banana-prata',
    productName: 'Banana prata',
    observationCount: 1,
    lastPurchasedAt: '2026-11-05T11:00:00.000Z',
  },
]

const comparison: ProductComparison = {
  productKey: 'leite-integral',
  productName: 'Leite integral',
  current: {
    id: 'observation-3',
    productName: 'Leite integral',
    quantity: 6,
    unit: 'un',
    unitPrice: 5.49,
    normalizedUnit: 'l',
    normalizedUnitPrice: 5.49,
    purchasedAt: '2026-11-18T18:30:00.000Z',
  },
  references: [
    {
      period: 'previous',
      observation: {
        id: 'observation-2',
        productName: 'Leite integral',
        quantity: 4,
        unit: 'un',
        unitPrice: 5.29,
        normalizedUnit: 'l',
        normalizedUnitPrice: 5.29,
        purchasedAt: '2026-11-05T11:00:00.000Z',
      },
      comparable: true,
      basisUnit: 'un',
      currentPrice: 5.49,
      referencePrice: 5.29,
      difference: 0.2,
      percentage: 0.0378,
      note: null,
    },
    {
      period: 'last7Days',
      observation: null,
      comparable: false,
      basisUnit: null,
      currentPrice: null,
      referencePrice: null,
      difference: null,
      percentage: null,
      note: 'Sem compras registradas nos últimos 7 dias.',
    },
    {
      period: 'previousMonth',
      observation: {
        id: 'observation-1',
        productName: 'Leite integral',
        quantity: 1,
        unit: 'l',
        unitPrice: 5.99,
        normalizedUnit: 'l',
        normalizedUnitPrice: 5.99,
        purchasedAt: '2026-10-20T08:00:00.000Z',
      },
      comparable: true,
      basisUnit: 'un',
      currentPrice: 5.49,
      referencePrice: 5.99,
      difference: -0.5,
      percentage: -0.0835,
      note: null,
    },
  ],
}

const sessionPayload = {
  session: {
    id: 'session-ana',
    token: 'session-token',
    userId: account.id,
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-11-19T09:00:00.000Z',
    updatedAt: '2026-11-19T09:00:00.000Z',
  },
  user: {
    id: account.id,
    name: account.name,
    email: account.email,
    emailVerified: true,
    createdAt: account.createdAt,
    updatedAt: '2026-11-19T09:00:00.000Z',
  },
}

async function mockApi(page: Page, authenticated: boolean) {
  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())

    if (pathname === '/api/auth/get-session') {
      await route.fulfill({ json: authenticated ? sessionPayload : null })
      return
    }

    if (!authenticated) {
      await route.fulfill({
        status: 401,
        json: { error: 'Sessão expirada. Entre novamente.' },
      })
      return
    }

    if (pathname === '/api/me') {
      await route.fulfill({ json: { account } })
      return
    }

    if (pathname === '/api/items') {
      await route.fulfill({
        json: { items, list: { id: 'list-casa', name: 'Compras da casa' } },
      })
      return
    }

    if (pathname === '/api/purchases') {
      await route.fulfill({ json: { purchases } })
      return
    }

    if (pathname === `/api/purchases/${purchase.id}`) {
      await route.fulfill({ json: { purchase } })
      return
    }

    if (pathname === '/api/products') {
      await route.fulfill({ json: { products } })
      return
    }

    if (pathname === '/api/comparisons') {
      await route.fulfill({ json: { comparison } })
      return
    }

    if (pathname === '/api/admin/users') {
      await route.fulfill({ json: { users: [account, ...otherAccounts] } })
      return
    }

    await route.fulfill({
      status: 404,
      json: { error: `Rota mockada não encontrada: ${pathname}` },
    })
  })
}

function collectPageErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  return errors
}

async function expectMobileLayout(page: Page, screen: string) {
  const metrics = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth

    const overflowing = Array.from(
      document.querySelectorAll('main *, form.card, nav'),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1)
      })
      .map((element) => {
        const className =
          typeof element.className === 'string' ? element.className : ''
        return `${element.tagName.toLowerCase()}.${className}`.slice(0, 80)
      })

    const smallTargets = Array.from(
      document.querySelectorAll('button, a.btn, nav a'),
    )
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.width < 44 || rect.height < 44)
      })
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return `${element.textContent?.trim()} (${Math.round(rect.width)}x${Math.round(rect.height)})`
      })

    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflowing: [...new Set(overflowing)],
      smallTargets,
    }
  })

  expect(
    metrics.scrollWidth,
    `${screen}: conteúdo mais largo que a viewport`,
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1)
  expect(metrics.overflowing, `${screen}: elementos vazando na horizontal`).toEqual(
    [],
  )
  expect(
    metrics.smallTargets,
    `${screen}: alvos de toque menores que 44px`,
  ).toEqual([])
}

const authenticatedScreens = [
  {
    name: 'lista',
    path: '/',
    ready: (page: Page) => page.getByRole('heading', { name: 'Sua lista' }),
  },
  {
    name: 'histórico',
    path: '/historico',
    ready: (page: Page) => page.getByRole('heading', { name: 'Histórico' }),
  },
  {
    name: 'detalhe da compra',
    path: `/historico/${purchase.id}`,
    ready: (page: Page) =>
      page.getByRole('heading', { name: purchase.name }),
  },
  {
    name: 'comparação',
    path: '/comparar',
    ready: (page: Page) =>
      page.getByRole('button', { name: /Leite integral/ }),
  },
  {
    name: 'administração',
    path: '/admin',
    ready: (page: Page) => page.getByRole('heading', { name: 'Contas' }),
  },
]

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: HEIGHT } })

    test('login cabe na tela e mantém alvos de toque', async ({ page }) => {
      const errors = collectPageErrors(page)
      await mockApi(page, false)

      await page.goto('/login')
      await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()

      await expectMobileLayout(page, 'login')
      expect(errors, 'login: erros no console').toEqual([])
    })

    test('telas autenticadas não vazam e mantêm alvos de toque', async ({
      page,
    }) => {
      const errors = collectPageErrors(page)
      await mockApi(page, true)

      for (const screen of authenticatedScreens) {
        await page.goto(screen.path)
        await expect(screen.ready(page)).toBeVisible()

        await expectMobileLayout(page, screen.name)
        expect(errors, `${screen.name}: erros no console`).toEqual([])
      }
    })

    test('comparação revela o resultado ao escolher o produto', async ({
      page,
    }) => {
      const errors = collectPageErrors(page)
      await mockApi(page, true)

      await page.goto('/comparar')
      await page.getByRole('button', { name: /Leite integral/ }).click()

      const result = page.locator('article')
      await expect(result.getByText('Preço mais recente:')).toBeVisible()

      await expect
        .poll(async () =>
          result.evaluate((element) => {
            const rect = element.getBoundingClientRect()
            return rect.top >= 0 && rect.top < window.innerHeight
          }),
        )
        .toBe(true)

      await expectMobileLayout(page, 'comparação com resultado')
      expect(errors, 'comparação: erros no console').toEqual([])
    })
  })
}
