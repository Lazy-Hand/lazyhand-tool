import { render, screen, fireEvent } from "@testing-library/vue"
import { expect, test, describe } from "vitest"
import { integerOnly, decimalOnly } from "."

describe("integerOnly Directive", () => {
  const TestIntegerComponent = {
    template: `<input v-integer-only="2" data-testid="integer-input" />`,
    directives: { integerOnly },
  }

  test("should only allow numeric input", async () => {
    render(TestIntegerComponent)
    const input = screen.getByTestId("integer-input")

    await fireEvent.update(input, "123abc")
    expect((input as HTMLInputElement).value).toBe("12")

    await fireEvent.update(input, "45.67")
    expect((input as HTMLInputElement).value).toBe("45")

    await fireEvent.update(input, "!@#$%")
    expect((input as HTMLInputElement).value).toBe("")
  })

  const TestDecimalComponent = {
    template: `<input v-decimal-only="2" data-testid="decimal-input" />`,
    directives: { decimalOnly },
  }

  test("should only allow decimal input", async () => {
    render(TestDecimalComponent)
    const input = screen.getByTestId("decimal-input")

    await fireEvent.update(input, "123abc..11")
    expect((input as HTMLInputElement).value).toBe("123.11")

    await fireEvent.update(input, "45.678")
    expect((input as HTMLInputElement).value).toBe("45.67")

    await fireEvent.update(input, "!@#$%")
    expect((input as HTMLInputElement).value).toBe("")
  })
})
