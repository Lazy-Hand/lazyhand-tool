import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/vue'
import { defineComponent, nextTick } from 'vue'
import { useMatchMedia, useScroll } from './index'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

describe('useMatchMedia', () => {
  let mockMatchMedia: any
  
  beforeEach(() => {
    mockMatchMedia = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    
    window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    cleanup()
  })
  
  it('should return initial match state', () => {
    const TestComponent = defineComponent({
      template: '<div data-testid="mobile-status">{{ isMobile }}</div>',
      setup() {
        const isMobile = useMatchMedia('(max-width: 768px)')
        return { isMobile }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    expect(getByTestId('mobile-status').textContent).toBe('false')
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 768px)')
  })
  
  it('should return true when media query matches', async () => {
    mockMatchMedia.matches = true
    
    const TestComponent = defineComponent({
      template: '<div data-testid="mobile-status">{{ isMobile }}</div>',
      setup() {
        const isMobile = useMatchMedia('(max-width: 768px)')
        return { isMobile }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    await nextTick()
    expect(getByTestId('mobile-status').textContent).toBe('true')
  })
  
  it('should add event listener on mount', () => {
    const TestComponent = defineComponent({
      template: '<div></div>',
      setup() {
        useMatchMedia('(max-width: 768px)')
        return {}
      }
    })
    
    render(TestComponent)
    expect(mockMatchMedia.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
  
  it('should remove event listener on unmount', () => {
    const TestComponent = defineComponent({
      template: '<div></div>',
      setup() {
        useMatchMedia('(max-width: 768px)')
        return {}
      }
    })
    
    const { unmount } = render(TestComponent)
    unmount()
    expect(mockMatchMedia.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})

describe('useScroll', () => {
  let scrollEventListener: ((event: Event) => void) | null = null
  
  beforeEach(() => {
    // Mock window properties
    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0,
    })
    
    Object.defineProperty(document.documentElement, 'scrollTop', {
      writable: true,
      value: 0,
    })
    
    // Mock addEventListener to capture the scroll handler
    window.addEventListener = vi.fn().mockImplementation((event, handler) => {
      if (event === 'scroll') {
        scrollEventListener = handler
      }
    })
    
    window.removeEventListener = vi.fn()
    window.scrollTo = vi.fn()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
    scrollEventListener = null
  })
  
  it('should return initial scroll state', () => {
    const TestComponent = defineComponent({
      template: '<div data-testid="scroll-status">{{ scrollTop }}-{{ isBottom }}-{{ scrollDirection }}</div>',
      setup() {
        const { scrollTop, isBottom, scrollDirection } = useScroll()
        return { scrollTop, isBottom, scrollDirection }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    expect(getByTestId('scroll-status').textContent).toBe('0-false-none')
  })
  
  it('should add scroll event listener on mount', () => {
    const TestComponent = defineComponent({
      template: '<div></div>',
      setup() {
        useScroll()
        return {}
      }
    })
    
    render(TestComponent)
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
  
  it('should remove scroll event listener on unmount', () => {
    const TestComponent = defineComponent({
      template: '<div></div>',
      setup() {
        useScroll()
        return {}
      }
    })
    
    const { unmount } = render(TestComponent)
    unmount()
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
  
  it('should update scroll position when scrolling', async () => {
    const TestComponent = defineComponent({
      template: '<div data-testid="scroll-top">{{ scrollTop }}</div>',
      setup() {
        const { scrollTop } = useScroll()
        return { scrollTop }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    
    // Simulate scroll
    Object.defineProperty(window, 'pageYOffset', { value: 100 })
    
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800
      }
    } as any
    
    if (scrollEventListener) {
      scrollEventListener(mockEvent)
    }
    
    await nextTick()
    expect(getByTestId('scroll-top').textContent).toBe('100')
  })
  
  it('should detect scroll direction', async () => {
    const TestComponent = defineComponent({
      template: '<div data-testid="scroll-direction">{{ scrollDirection }}</div>',
      setup() {
        const { scrollDirection } = useScroll()
        return { scrollDirection }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    
    // Simulate scrolling down
    Object.defineProperty(window, 'pageYOffset', { value: 100 })
    
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800
      }
    } as any
    
    if (scrollEventListener) {
      scrollEventListener(mockEvent)
    }
    
    await nextTick()
    expect(getByTestId('scroll-direction').textContent).toBe('down')
    
    // Simulate scrolling up
    Object.defineProperty(window, 'pageYOffset', { value: 50 })
    
    if (scrollEventListener) {
      scrollEventListener(mockEvent)
    }
    
    await nextTick()
    expect(getByTestId('scroll-direction').textContent).toBe('up')
  })
  
  it('should detect when scrolled to bottom', async () => {
    const TestComponent = defineComponent({
      template: '<div data-testid="is-bottom">{{ isBottom }}</div>',
      setup() {
        const { isBottom } = useScroll()
        return { isBottom }
      }
    })
    
    const { getByTestId } = render(TestComponent)
    
    // Simulate scroll to bottom
    Object.defineProperty(window, 'pageYOffset', { value: 200 })
    
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800
      }
    } as any
    
    if (scrollEventListener) {
      scrollEventListener(mockEvent)
    }
    
    await nextTick()
    expect(getByTestId('is-bottom').textContent).toBe('true')
  })
  
  it('should call scrollToTop method', () => {
    const TestComponent = defineComponent({
      template: '<div></div>',
      setup() {
        const { scrollToTop } = useScroll()
        scrollToTop()
        return {}
      }
    })
    
    render(TestComponent)
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    })
  })
})