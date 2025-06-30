import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useScroll } from "../useScroll"

// Mock Vue composition API
vi.mock("vue", () => ({
  ref: vi.fn((value) => ({ value })),
  onMounted: vi.fn((fn) => fn()),
  onUnmounted: vi.fn(),
}))

describe("useScroll", () => {
  let mockAddEventListener: any
  let mockRemoveEventListener: any
  let mockScrollTo: any

  beforeEach(() => {
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()
    mockScrollTo = vi.fn()

    // Mock window methods
    Object.defineProperty(window, "addEventListener", {
      writable: true,
      value: mockAddEventListener,
    })

    Object.defineProperty(window, "removeEventListener", {
      writable: true,
      value: mockRemoveEventListener,
    })

    Object.defineProperty(window, "scrollTo", {
      writable: true,
      value: mockScrollTo,
    })

    Object.defineProperty(window, "pageYOffset", {
      writable: true,
      value: 0,
    })

    // Mock document.documentElement
    Object.defineProperty(document, "documentElement", {
      writable: true,
      value: {
        scrollTop: 0,
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { scrollTop, isBottom, scrollDirection } = useScroll()

    expect(scrollTop.value).toBe(0)
    expect(isBottom.value).toBe(false)
    expect(scrollDirection.value).toBe("none")
  })

  it("should add scroll event listener on mount", () => {
    useScroll()

    expect(mockAddEventListener).toHaveBeenCalledWith("scroll", expect.any(Function))
  })

  it("should provide scrollToTop function", () => {
    const { scrollToTop } = useScroll()

    scrollToTop()

    expect(mockScrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    })
  })

  it("should update scrollTop when scrolling", () => {
    window.pageYOffset = 100

    const { scrollTop } = useScroll()

    // Simulate scroll event
    const scrollHandler = mockAddEventListener.mock.calls[0][1]
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800,
      },
    }

    scrollHandler(mockEvent)

    expect(scrollTop.value).toBe(100)
  })

  it("should detect scroll direction down", () => {
    const { scrollDirection } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // First scroll to position 0
    window.pageYOffset = 0
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    // Then scroll down to position 100
    window.pageYOffset = 100
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    expect(scrollDirection.value).toBe("down")
  })

  it("should detect scroll direction up", () => {
    const { scrollDirection } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // First scroll to position 100
    window.pageYOffset = 100
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    // Then scroll up to position 50
    window.pageYOffset = 50
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    expect(scrollDirection.value).toBe("up")
  })

  it("should detect when scrolled to bottom", () => {
    const { isBottom } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // Scroll to bottom (scrollTop + clientHeight >= scrollHeight)
    window.pageYOffset = 200
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800,
      },
    }

    scrollHandler(mockEvent)

    expect(isBottom.value).toBe(true)
  })

  it("should detect when not at bottom", () => {
    const { isBottom } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // Scroll but not to bottom
    window.pageYOffset = 100
    const mockEvent = {
      target: {
        scrollHeight: 1000,
        clientHeight: 800,
      },
    }

    scrollHandler(mockEvent)

    expect(isBottom.value).toBe(false)
  })

  it("should use document.documentElement.scrollTop as fallback", () => {
    // Set pageYOffset to undefined to test fallback
    Object.defineProperty(window, "pageYOffset", {
      writable: true,
      value: undefined,
    })

    document.documentElement.scrollTop = 150

    const { scrollTop } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    expect(scrollTop.value).toBe(150)
  })

  it("should handle scroll direction none when position unchanged", () => {
    const { scrollDirection } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // Scroll to same position twice
    window.pageYOffset = 100
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })

    expect(scrollDirection.value).toBe("none")
  })

  it("should handle multiple scroll events correctly", () => {
    const { scrollTop, scrollDirection, isBottom } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    // First scroll
    window.pageYOffset = 50
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })
    expect(scrollTop.value).toBe(50)
    expect(scrollDirection.value).toBe("down")
    expect(isBottom.value).toBe(false)

    // Second scroll
    window.pageYOffset = 200
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })
    expect(scrollTop.value).toBe(200)
    expect(scrollDirection.value).toBe("down")
    expect(isBottom.value).toBe(true)

    // Third scroll (up)
    window.pageYOffset = 100
    scrollHandler({ target: { scrollHeight: 1000, clientHeight: 800 } })
    expect(scrollTop.value).toBe(100)
    expect(scrollDirection.value).toBe("up")
    expect(isBottom.value).toBe(false)
  })

  it("should handle edge case when scrollHeight equals clientHeight", () => {
    const { isBottom } = useScroll()
    const scrollHandler = mockAddEventListener.mock.calls[0][1]

    window.pageYOffset = 0
    const mockEvent = {
      target: {
        scrollHeight: 800,
        clientHeight: 800,
      },
    }

    scrollHandler(mockEvent)

    expect(isBottom.value).toBe(true)
  })

  it("should return all expected properties and methods", () => {
    const result = useScroll()

    expect(result).toHaveProperty("scrollTop")
    expect(result).toHaveProperty("isBottom")
    expect(result).toHaveProperty("scrollDirection")
    expect(result).toHaveProperty("scrollToTop")
    expect(typeof result.scrollToTop).toBe("function")
  })
})
