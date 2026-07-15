import { describe, it, expect } from 'vitest'
import { routes } from '../router'

// ---------------------------------------------------------------------------
// Route structure
// ---------------------------------------------------------------------------

describe('router routes', () => {
  it('has a parent :lang route for EN and FR', () => {
    const langRoute = routes.find(r => r.path === '/:lang(en|fr)')
    expect(langRoute).toBeDefined()
    expect(langRoute!.children).toBeDefined()
    expect(langRoute!.children!.length).toBeGreaterThan(0)
  })

  it('has page routes as children of :lang', () => {
    const langRoute = routes.find(r => r.path === '/:lang(en|fr)')
    const childPaths = langRoute!.children!.map(c => c.path)
    expect(childPaths).toContain('')
    expect(childPaths).toContain('meetings')
    expect(childPaths).toContain('about')
    expect(childPaths).toContain('resolution/:id')
    expect(childPaths).toContain('meetings/:meetingSlug')
  })

  it('has named routes for each page', () => {
    const langRoute = routes.find(r => r.path === '/:lang(en|fr)')
    const childNames = langRoute!.children!.map(c => c.name)
    expect(childNames).toContain('home')
    expect(childNames).toContain('meetings')
    expect(childNames).toContain('about')
    expect(childNames).toContain('resolution-detail')
    expect(childNames).toContain('meeting-detail')
  })

  it('has a root redirect route', () => {
    const rootRoute = routes.find(r => r.path === '/')
    expect(rootRoute).toBeDefined()
    expect(rootRoute!.redirect).toBeDefined()
  })

  it('has legacy bare-path redirects', () => {
    const paths = routes.filter(r => r.redirect).map(r => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/about')
    expect(paths).toContain('/meetings')
    expect(paths).toContain('/meetings/:meetingSlug')
    expect(paths).toContain('/resolution/:id')
  })
})
