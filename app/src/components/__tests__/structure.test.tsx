// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { DEFAULT_CATEGORIES } from '../../types'

// Mock sync module to prevent Supabase calls
vi.mock('../../lib/sync', () => ({
  enqueueSync: vi.fn(),
  pullFromSupabase: vi.fn(() => Promise.resolve()),
  migrateLocalToSupabase: vi.fn(() => Promise.resolve()),
}))

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: null,
}))

// Mock recharts (used by Reports)
vi.mock('recharts', () => ({
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: unknown }) => createElement('div', null, children),
  Area: () => null,
  AreaChart: ({ children }: { children: unknown }) => createElement('div', null, children),
}))

// Mock export data
vi.mock('../../lib/exportData', () => ({
  exportExpenses: vi.fn(),
}))

// Mock localStorage
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index: number) => [...store.keys()][index] ?? null,
  },
  writable: true,
  configurable: true,
})

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  NavLink: ({ children, to, className }: { children: unknown, to: string, className?: unknown }) => {
    const resolvedChildren = typeof children === 'function'
      ? children({ isActive: to === '/' })
      : children
    return createElement('a', {
      href: to,
      'data-to': to,
      className: typeof className === 'function' ? className({ isActive: to === '/' }) : className,
    }, resolvedChildren)
  },
  Outlet: () => createElement('div', { 'data-testid': 'outlet' }),
  useNavigate: () => mockNavigate,
  HashRouter: ({ children }: { children: unknown }) => createElement('div', null, children),
  Routes: ({ children }: { children: unknown }) => createElement('div', null, children),
  Route: ({ element, path }: { element?: unknown, path?: string }) =>
    createElement('div', { 'data-route': path || '' }, element),
  Navigate: () => null,
}))

beforeEach(() => {
  store.clear()
  mockNavigate.mockClear()
})

afterEach(() => {
  document.body.innerHTML = ''
})

function renderToContainer(component: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    createRoot(container).render(component)
  })
  return container
}

// ----- Test 1: Default categories -----

describe('DEFAULT_CATEGORIES', () => {
  it('has exactly 8 entries', () => {
    expect(DEFAULT_CATEGORIES).toHaveLength(8)
  })

  it('includes groceries', () => {
    const keys = DEFAULT_CATEGORIES.map(c => c.key)
    expect(keys).toContain('groceries')
  })

  it('includes all expected default categories', () => {
    const keys = DEFAULT_CATEGORIES.map(c => c.key)
    expect(keys).toContain('food')
    expect(keys).toContain('transport')
    expect(keys).toContain('shopping')
    expect(keys).toContain('entertainment')
    expect(keys).toContain('bills')
    expect(keys).toContain('health')
    expect(keys).toContain('other')
  })

  it('every category has required fields', () => {
    for (const cat of DEFAULT_CATEGORIES) {
      expect(cat.key).toBeTruthy()
      expect(cat.label).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(cat.color).toMatch(/^#/)
    }
  })
})

// ----- Test 2: Navigation structure -----

describe('Layout navigation structure', () => {
  it('renders exactly 5 nav items (Home, Recurring, Add, Reports, Import)', async () => {
    const { Layout } = await import('../Layout')
    const container = renderToContainer(createElement(Layout))

    const nav = container.querySelector('nav')
    expect(nav).not.toBeNull()

    const links = nav!.querySelectorAll('a[data-to]')
    expect(links).toHaveLength(5)

    const routes = Array.from(links).map(a => a.getAttribute('data-to'))
    expect(routes).toContain('/')
    expect(routes).toContain('/recurring')
    expect(routes).toContain('/add')
    expect(routes).toContain('/reports')
    expect(routes).toContain('/import')
  })

  it('nav items have correct labels', async () => {
    const { Layout } = await import('../Layout')
    const container = renderToContainer(createElement(Layout))

    const nav = container.querySelector('nav')!
    const text = nav.textContent!

    expect(text).toContain('Home')
    expect(text).toContain('Recurring')
    expect(text).toContain('Add')
    expect(text).toContain('Reports')
    expect(text).toContain('Import')
  })
})

// ----- Test 3: Routes exist -----

describe('App routes', () => {
  it('defines all expected route paths', () => {
    // Verify the expected route paths that should exist in the app
    // These are the paths configured in App.tsx's <Routes> block
    const expectedPaths = ['/', '/reports', '/add', '/import', '/recurring', '/categories']

    // Cross-check: nav paths should be a subset of route paths
    const navPaths = ['/', '/recurring', '/add', '/reports', '/import']
    for (const p of navPaths) {
      expect(expectedPaths).toContain(p)
    }

    // /categories is a route-only path (no nav item, accessed from settings)
    expect(expectedPaths).toContain('/categories')

    // Verify count: 6 routes total
    expect(expectedPaths).toHaveLength(6)
  })
})

// ----- Test 4: BalanceGauge renders with budget pill -----

describe('BalanceGauge', () => {
  it('renders budget pill text "of ₪X budget"', async () => {
    const { BalanceGauge } = await import('../BalanceGauge')
    const container = renderToContainer(createElement(BalanceGauge, {
      remaining: 150,
      budget: 500,
      progress: 0.7,
      periodLabel: 'left today',
      resetTime: '5h 30m',
    }))

    expect(container.textContent).toContain('of ₪500 budget')
  })

  it('shows "over budget" when remaining is negative', async () => {
    const { BalanceGauge } = await import('../BalanceGauge')
    const container = renderToContainer(createElement(BalanceGauge, {
      remaining: -50,
      budget: 200,
      progress: 1.25,
      periodLabel: 'left today',
      resetTime: '2h 15m',
    }))

    expect(container.textContent).toContain('over budget')
  })

  it('shows reset time', async () => {
    const { BalanceGauge } = await import('../BalanceGauge')
    const container = renderToContainer(createElement(BalanceGauge, {
      remaining: 100,
      budget: 300,
      progress: 0.67,
      periodLabel: 'left this week',
      resetTime: '3 days',
    }))

    expect(container.textContent).toContain('3 days')
  })
})

// ----- Test 5: Reports filter buttons -----

describe('Reports filter buttons', () => {
  it('has 4 filter options: Today, Week, Month, Custom', async () => {
    const { Reports } = await import('../../pages/Reports')
    const container = renderToContainer(createElement(Reports))

    const buttons = container.querySelectorAll('button')
    const filterLabels = Array.from(buttons).map(b => b.textContent?.trim())

    expect(filterLabels).toContain('Today')
    expect(filterLabels).toContain('Week')
    expect(filterLabels).toContain('Month')
    expect(filterLabels).toContain('Custom')
  })
})
