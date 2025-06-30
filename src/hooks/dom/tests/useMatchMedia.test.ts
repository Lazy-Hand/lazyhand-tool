import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useMatchMedia } from "../useMatchMedia"

// Mock Vue composition API
vi.mock("vue", () => ({
  ref: vi.fn((value) => ({ value })),
  onMounted: vi.fn((fn) => fn()),
  onUnmounted: vi.fn(),
}))

describe("useMatchMedia", () => {
  let mockMediaQuery: any
  let mockAddEventListener: any
  let mockRemoveEventListener: any

  beforeEach(() => {
    mockAddEventListener = vi.fn()
    mockRemoveEventListener = vi.fn()

    mockMediaQuery = {
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    }

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => mockMediaQuery),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should create media query and return initial match state", () => {
    const query = "(max-width: 768px)"
    mockMediaQuery.matches = true

    const result = useMatchMedia(query)

    expect(window.matchMedia).toHaveBeenCalledWith(query)
    expect(result.value).toBe(true)
  })

  it("should return false when media query does not match", () => {
    const query = "(min-width: 1200px)"
    mockMediaQuery.matches = false

    const result = useMatchMedia(query)

    expect(result.value).toBe(false)
  })

  it("should add event listener on mount", () => {
    const query = "(max-width: 768px)"

    useMatchMedia(query)

    expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })

  it("should update match value when media query changes", () => {
    const query = "(max-width: 768px)"
    mockMediaQuery.matches = false

    const result = useMatchMedia(query)
    expect(result.value).toBe(false)

    // Simulate media query change
    const changeHandler = mockAddEventListener.mock.calls[0][1]
    const mockEvent = { matches: true }
    changeHandler(mockEvent)

    expect(result.value).toBe(true)
  })

  it("should handle multiple media query changes", () => {
    const query = "(orientation: portrait)"
    mockMediaQuery.matches = true

    const result = useMatchMedia(query)
    expect(result.value).toBe(true)

    const changeHandler = mockAddEventListener.mock.calls[0][1]

    // First change
    changeHandler({ matches: false })
    expect(result.value).toBe(false)

    // Second change
    changeHandler({ matches: true })
    expect(result.value).toBe(true)
  })

  it("should work with complex media queries", () => {
    const complexQuery = "(min-width: 768px) and (max-width: 1024px)"
    mockMediaQuery.matches = true

    const result = useMatchMedia(complexQuery)

    expect(window.matchMedia).toHaveBeenCalledWith(complexQuery)
    expect(result.value).toBe(true)
  })

  it("should work with prefers-color-scheme queries", () => {
    const darkModeQuery = "(prefers-color-scheme: dark)"
    mockMediaQuery.matches = false

    const result = useMatchMedia(darkModeQuery)

    expect(window.matchMedia).toHaveBeenCalledWith(darkModeQuery)
    expect(result.value).toBe(false)
  })

  it("should work with orientation queries", () => {
    const orientationQuery = "(orientation: landscape)"
    mockMediaQuery.matches = true

    const result = useMatchMedia(orientationQuery)

    expect(result.value).toBe(true)
  })

  it("should handle invalid media queries gracefully", () => {
    const invalidQuery = "invalid-query"
    mockMediaQuery.matches = false

    const result = useMatchMedia(invalidQuery)

    expect(window.matchMedia).toHaveBeenCalledWith(invalidQuery)
    expect(result.value).toBe(false)
  })

  it("should create separate instances for different queries", () => {
    const query1 = "(max-width: 768px)"
    const query2 = "(min-width: 1024px)"

    const result1 = useMatchMedia(query1)
    const result2 = useMatchMedia(query2)

    expect(window.matchMedia).toHaveBeenCalledTimes(2)
    expect(window.matchMedia).toHaveBeenNthCalledWith(1, query1)
    expect(window.matchMedia).toHaveBeenNthCalledWith(2, query2)
  })
})
