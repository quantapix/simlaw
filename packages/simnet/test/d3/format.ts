import assert from "assert"
import { readFileSync } from "fs"
import { formatLocale } from "../src/index.js"

function locale(locale) {
  return formatLocale(JSON.parse(readFileSync(`./locale/${locale}.json`, "utf8")))
}

it("formatLocale() can format numbers using ar-001 locale", () => {
  assert.strictEqual(locale("ar-001").format("$,.2f")(-1234.56), "−١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-AE locale", () => {
  assert.strictEqual(locale("ar-AE").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ د.إ.")
})

it("formatLocale() can format numbers using ar-BH locale", () => {
  assert.strictEqual(locale("ar-BH").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ د.ب.")
})

it("formatLocale() can format numbers using ar-DJ locale", () => {
  assert.strictEqual(locale("ar-DJ").format("$,.2f")(1234.56), "\u200fFdj ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-DZ locale", () => {
  assert.strictEqual(locale("ar-DZ").format("$,.2f")(1234.56), "د.ج. 1.234,56")
})

it("formatLocale() can format numbers using ar-EG locale", () => {
  assert.strictEqual(locale("ar-EG").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ج.م.")
})

it("formatLocale() can format numbers using ar-EH locale", () => {
  assert.strictEqual(locale("ar-EH").format("$,.2f")(1234.56), "د.م. 1,234.56")
})

it("formatLocale() can format numbers using ar-ER locale", () => {
  assert.strictEqual(locale("ar-ER").format("$,.2f")(1234.56), "Nfk ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-IL locale", () => {
  assert.strictEqual(locale("ar-IL").format("$,.2f")(1234.56), "₪ ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-IQ locale", () => {
  assert.strictEqual(locale("ar-IQ").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ د.ع.")
})

it("formatLocale() can format numbers using ar-JO locale", () => {
  assert.strictEqual(locale("ar-JO").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ د.أ.")
})

it("formatLocale() can format numbers using ar-KM locale", () => {
  assert.strictEqual(locale("ar-KM").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ف.ج.ق.")
})

it("formatLocale() can format numbers using ar-KW locale", () => {
  assert.strictEqual(locale("ar-KW").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ د.ك.")
})

it("formatLocale() can format numbers using ar-LB locale", () => {
  assert.strictEqual(locale("ar-LB").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ل.ل.")
})

it("formatLocale() can format numbers using ar-MA locale", () => {
  assert.strictEqual(locale("ar-MA").format("$,.2f")(1234.56), "د.م. 1.234,56")
})

it("formatLocale() can format numbers using ar-MR locale", () => {
  assert.strictEqual(locale("ar-MR").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ أ.م.")
})

it("formatLocale() can format numbers using ar-OM locale", () => {
  assert.strictEqual(locale("ar-OM").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ر.ع.")
})

it("formatLocale() can format numbers using ar-PS locale", () => {
  assert.strictEqual(locale("ar-PS").format("$,.2f")(1234.56), "₪ ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-QA locale", () => {
  assert.strictEqual(locale("ar-QA").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ر.ق.")
})

it("formatLocale() can format numbers using ar-SA locale", () => {
  assert.strictEqual(locale("ar-SA").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ر.س.")
})

it("formatLocale() can format numbers using ar-SD locale", () => {
  assert.strictEqual(locale("ar-SD").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ج.س.")
})

it("formatLocale() can format numbers using ar-SO locale", () => {
  assert.strictEqual(locale("ar-SO").format("$,.2f")(1234.56), "‏S ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-SS locale", () => {
  assert.strictEqual(locale("ar-SS").format("$,.2f")(1234.56), "£ ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-SY locale", () => {
  assert.strictEqual(locale("ar-SY").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ل.س.")
})

it("formatLocale() can format numbers using ar-TD locale", () => {
  assert.strictEqual(locale("ar-TD").format("$,.2f")(1234.56), "\u200fFCFA ١٬٢٣٤٫٥٦")
})

it("formatLocale() can format numbers using ar-TN locale", () => {
  assert.strictEqual(locale("ar-TN").format("$,.2f")(1234.56), "د.ت. 1.234,56")
})

it("formatLocale() can format numbers using ar-YE locale", () => {
  assert.strictEqual(locale("ar-YE").format("$,.2f")(1234.56), "١٬٢٣٤٫٥٦ ر.ى.")
})
import assert from "assert"
import { format, formatPrefix, formatDefaultLocale } from "../src/index.js"

const enUs = {
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
}

const frFr = {
  decimal: ",",
  thousands: ".",
  grouping: [3],
  currency: ["", "\u00a0€"],
  percent: "\u202f%",
}

it("formatDefaultLocale(definition) returns the new default locale", () => {
  const locale = formatDefaultLocale(frFr)
  try {
    assert.strictEqual(locale.format("$,.2f")(12345678.9), "12.345.678,90 €")
    assert.strictEqual(locale.format(",.0%")(12345678.9), "1.234.567.890\u202f%")
  } finally {
    formatDefaultLocale(enUs)
  }
})

it("formatDefaultLocale(definition) affects format", () => {
  const locale = formatDefaultLocale(frFr)
  try {
    assert.strictEqual(format, locale.format)
    assert.strictEqual(format("$,.2f")(12345678.9), "12.345.678,90 €")
  } finally {
    formatDefaultLocale(enUs)
  }
})

it("formatDefaultLocale(definition) affects formatPrefix", () => {
  const locale = formatDefaultLocale(frFr)
  try {
    assert.strictEqual(formatPrefix, locale.formatPrefix)
    assert.strictEqual(formatPrefix(",.2", 1e3)(12345678.9), "12.345,68k")
  } finally {
    formatDefaultLocale(enUs)
  }
})
import assert from "assert"
import { format } from "../src/index.js"

it("format(specifier)(number) returns a string", () => {
  assert.strictEqual(typeof format("d")(0), "string")
})

it("format(specifier).toString() returns the normalized specifier", () => {
  assert.strictEqual(format("d") + "", " >-d")
})

it("format(specifier) throws an error for invalid formats", () => {
  assert.throws(() => {
    format("foo")
  }, /invalid format: foo/)
  assert.throws(() => {
    format(".-2s")
  }, /invalid format: \.-2s/)
  assert.throws(() => {
    format(".f")
  }, /invalid format: \.f/)
})

it('format(",.") unreasonable precision values are clamped to reasonable values', () => {
  assert.strictEqual(format(".30f")(0), "0.00000000000000000000")
  assert.strictEqual(format(".0g")(1), "1")
})

it('format("s") handles very small and very large values', () => {
  assert.strictEqual(
    format("s")(Number.MIN_VALUE),
    "0.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005y"
  )
  assert.strictEqual(
    format("s")(Number.MAX_VALUE),
    "179769000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000Y"
  )
})

it('format("n") is equivalent to format(",g")', () => {
  assert.strictEqual(format("n")(123456.78), "123,457")
  assert.strictEqual(format(",g")(123456.78), "123,457")
})

it('format("012") is equivalent to format("0=12")', () => {
  assert.strictEqual(format("012")(123.456), "00000123.456")
  assert.strictEqual(format("0=12")(123.456), "00000123.456")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("~r") trims insignificant zeros', () => {
  const f = format("~r")
  assert.strictEqual(f(1), "1")
  assert.strictEqual(f(0.1), "0.1")
  assert.strictEqual(f(0.01), "0.01")
  assert.strictEqual(f(10.0001), "10.0001")
  assert.strictEqual(f(123.45), "123.45")
  assert.strictEqual(f(123.456), "123.456")
  assert.strictEqual(f(123.4567), "123.457")
  assert.strictEqual(f(0.000009), "0.000009")
  assert.strictEqual(f(0.0000009), "0.0000009")
  assert.strictEqual(f(0.00000009), "0.00000009")
  assert.strictEqual(f(0.111119), "0.111119")
  assert.strictEqual(f(0.1111119), "0.111112")
  assert.strictEqual(f(0.11111119), "0.111111")
})

it('format("~e") trims insignificant zeros', () => {
  const f = format("~e")
  assert.strictEqual(f(0), "0e+0")
  assert.strictEqual(f(42), "4.2e+1")
  assert.strictEqual(f(42000000), "4.2e+7")
  assert.strictEqual(f(0.042), "4.2e-2")
  assert.strictEqual(f(-4), "−4e+0")
  assert.strictEqual(f(-42), "−4.2e+1")
  assert.strictEqual(f(42000000000), "4.2e+10")
  assert.strictEqual(f(0.00000000042), "4.2e-10")
})

it('format(".4~e") trims insignificant zeros', () => {
  const f = format(".4~e")
  assert.strictEqual(f(0.00000000012345), "1.2345e-10")
  assert.strictEqual(f(0.0000000001234), "1.234e-10")
  assert.strictEqual(f(0.000000000123), "1.23e-10")
  assert.strictEqual(f(-0.00000000012345), "−1.2345e-10")
  assert.strictEqual(f(-0.0000000001234), "−1.234e-10")
  assert.strictEqual(f(-0.000000000123), "−1.23e-10")
  assert.strictEqual(f(12345000000), "1.2345e+10")
  assert.strictEqual(f(12340000000), "1.234e+10")
  assert.strictEqual(f(12300000000), "1.23e+10")
  assert.strictEqual(f(-12345000000), "−1.2345e+10")
  assert.strictEqual(f(-12340000000), "−1.234e+10")
  assert.strictEqual(f(-12300000000), "−1.23e+10")
})

it('format("~s") trims insignificant zeros', () => {
  const f = format("~s")
  assert.strictEqual(f(0), "0")
  assert.strictEqual(f(1), "1")
  assert.strictEqual(f(10), "10")
  assert.strictEqual(f(100), "100")
  assert.strictEqual(f(999.5), "999.5")
  assert.strictEqual(f(999500), "999.5k")
  assert.strictEqual(f(1000), "1k")
  assert.strictEqual(f(1400), "1.4k")
  assert.strictEqual(f(1500), "1.5k")
  assert.strictEqual(f(1500.5), "1.5005k")
  assert.strictEqual(f(1e-15), "1f")
  assert.strictEqual(f(1e-12), "1p")
  assert.strictEqual(f(1e-9), "1n")
  assert.strictEqual(f(1e-6), "1µ")
  assert.strictEqual(f(1e-3), "1m")
  assert.strictEqual(f(1), "1")
  assert.strictEqual(f(1e3), "1k")
  assert.strictEqual(f(1e6), "1M")
  assert.strictEqual(f(1e9), "1G")
  assert.strictEqual(f(1e12), "1T")
  assert.strictEqual(f(1e15), "1P")
})

it('format("~%") trims insignificant zeros', () => {
  const f = format("~%")
  assert.strictEqual(f(0), "0%")
  assert.strictEqual(f(0.1), "10%")
  assert.strictEqual(f(0.01), "1%")
  assert.strictEqual(f(0.001), "0.1%")
  assert.strictEqual(f(0.0001), "0.01%")
})

it("trimming respects commas", () => {
  const f = format(",~g")
  assert.strictEqual(f(10000.0), "10,000")
  assert.strictEqual(f(10000.1), "10,000.1")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("%") can output a whole percentage', () => {
  const f = format(".0%")
  assert.strictEqual(f(0), "0%")
  assert.strictEqual(f(0.042), "4%")
  assert.strictEqual(f(0.42), "42%")
  assert.strictEqual(f(4.2), "420%")
  assert.strictEqual(f(-0.042), "−4%")
  assert.strictEqual(f(-0.42), "−42%")
  assert.strictEqual(f(-4.2), "−420%")
})

it('format(".%") can output a percentage with precision', () => {
  const f1 = format(".1%")
  assert.strictEqual(f1(0.234), "23.4%")
  const f2 = format(".2%")
  assert.strictEqual(f2(0.234), "23.40%")
})

it('format("%") fill respects suffix', () => {
  assert.strictEqual(format("020.0%")(42), "0000000000000004200%")
  assert.strictEqual(format("20.0%")(42), "               4200%")
})

it('format("^%") align center puts suffix adjacent to number', () => {
  assert.strictEqual(format("^21.0%")(0.42), "         42%         ")
  assert.strictEqual(format("^21,.0%")(422), "       42,200%       ")
  assert.strictEqual(format("^21,.0%")(-422), "      −42,200%       ")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("b") binary', () => {
  assert.strictEqual(format("b")(10), "1010")
})

it('format("#b") binary with prefix', () => {
  assert.strictEqual(format("#b")(10), "0b1010")
})
import assert from "assert"
import { format, formatLocale } from "../src/index.js"

it('format("c") unicode character', () => {
  assert.strictEqual(format("c")("☃"), "☃")
  assert.strictEqual(format("020c")("☃"), "0000000000000000000☃")
  assert.strictEqual(format(" ^20c")("☃"), "         ☃          ")
  assert.strictEqual(format("$c")("☃"), "$☃")
})

it('format("c") does not localize a decimal point', () => {
  assert.strictEqual(formatLocale({ decimal: "/" }).format("c")("."), ".")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("d") can zero fill', () => {
  const f = format("08d")
  assert.strictEqual(f(0), "00000000")
  assert.strictEqual(f(42), "00000042")
  assert.strictEqual(f(42000000), "42000000")
  assert.strictEqual(f(420000000), "420000000")
  assert.strictEqual(f(-4), "−0000004")
  assert.strictEqual(f(-42), "−0000042")
  assert.strictEqual(f(-4200000), "−4200000")
  assert.strictEqual(f(-42000000), "−42000000")
})

it('format("d") can space fill', () => {
  const f = format("8d")
  assert.strictEqual(f(0), "       0")
  assert.strictEqual(f(42), "      42")
  assert.strictEqual(f(42000000), "42000000")
  assert.strictEqual(f(420000000), "420000000")
  assert.strictEqual(f(-4), "      −4")
  assert.strictEqual(f(-42), "     −42")
  assert.strictEqual(f(-4200000), "−4200000")
  assert.strictEqual(f(-42000000), "−42000000")
})

it('format("d") can underscore fill', () => {
  const f = format("_>8d")
  assert.strictEqual(f(0), "_______0")
  assert.strictEqual(f(42), "______42")
  assert.strictEqual(f(42000000), "42000000")
  assert.strictEqual(f(420000000), "420000000")
  assert.strictEqual(f(-4), "______−4")
  assert.strictEqual(f(-42), "_____−42")
  assert.strictEqual(f(-4200000), "−4200000")
  assert.strictEqual(f(-42000000), "−42000000")
})

it('format("d") can zero fill with sign and group', () => {
  const f = format("+08,d")
  assert.strictEqual(f(0), "+0,000,000")
  assert.strictEqual(f(42), "+0,000,042")
  assert.strictEqual(f(42000000), "+42,000,000")
  assert.strictEqual(f(420000000), "+420,000,000")
  assert.strictEqual(f(-4), "−0,000,004")
  assert.strictEqual(f(-42), "−0,000,042")
  assert.strictEqual(f(-4200000), "−4,200,000")
  assert.strictEqual(f(-42000000), "−42,000,000")
})

it('format("d") always uses zero precision', () => {
  const f = format(".2d")
  assert.strictEqual(f(0), "0")
  assert.strictEqual(f(42), "42")
  assert.strictEqual(f(-4.2), "−4")
})

it('format("d") rounds non-integers', () => {
  const f = format("d")
  assert.strictEqual(f(4.2), "4")
})

it('format(",d") can group thousands', () => {
  const f = format(",d")
  assert.strictEqual(f(0), "0")
  assert.strictEqual(f(42), "42")
  assert.strictEqual(f(42000000), "42,000,000")
  assert.strictEqual(f(420000000), "420,000,000")
  assert.strictEqual(f(-4), "−4")
  assert.strictEqual(f(-42), "−42")
  assert.strictEqual(f(-4200000), "−4,200,000")
  assert.strictEqual(f(-42000000), "−42,000,000")
  assert.strictEqual(f(1e21), "1,000,000,000,000,000,000,000")
  assert.strictEqual(f(1.3e27), "1,300,000,000,000,000,000,000,000,000")
  assert.strictEqual(
    f(1.3e107),
    "130,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000,000"
  )
})

it('format("0,d") can group thousands and zero fill', () => {
  assert.strictEqual(format("01,d")(0), "0")
  assert.strictEqual(format("01,d")(0), "0")
  assert.strictEqual(format("02,d")(0), "00")
  assert.strictEqual(format("03,d")(0), "000")
  assert.strictEqual(format("04,d")(0), "0,000")
  assert.strictEqual(format("05,d")(0), "0,000")
  assert.strictEqual(format("06,d")(0), "00,000")
  assert.strictEqual(format("08,d")(0), "0,000,000")
  assert.strictEqual(format("013,d")(0), "0,000,000,000")
  assert.strictEqual(format("021,d")(0), "0,000,000,000,000,000")
  assert.strictEqual(format("013,d")(-42000000), "−0,042,000,000")
  assert.strictEqual(format("012,d")(1e21), "1,000,000,000,000,000,000,000")
  assert.strictEqual(format("013,d")(1e21), "1,000,000,000,000,000,000,000")
  assert.strictEqual(format("014,d")(1e21), "1,000,000,000,000,000,000,000")
  assert.strictEqual(format("015,d")(1e21), "1,000,000,000,000,000,000,000")
})

it('format("0,d") can group thousands and zero fill with overflow', () => {
  assert.strictEqual(format("01,d")(1), "1")
  assert.strictEqual(format("01,d")(1), "1")
  assert.strictEqual(format("02,d")(12), "12")
  assert.strictEqual(format("03,d")(123), "123")
  assert.strictEqual(format("05,d")(12345), "12,345")
  assert.strictEqual(format("08,d")(12345678), "12,345,678")
  assert.strictEqual(format("013,d")(1234567890123), "1,234,567,890,123")
})

it('format(",d") can group thousands and space fill', () => {
  assert.strictEqual(format("1,d")(0), "0")
  assert.strictEqual(format("1,d")(0), "0")
  assert.strictEqual(format("2,d")(0), " 0")
  assert.strictEqual(format("3,d")(0), "  0")
  assert.strictEqual(format("5,d")(0), "    0")
  assert.strictEqual(format("8,d")(0), "       0")
  assert.strictEqual(format("13,d")(0), "            0")
  assert.strictEqual(format("21,d")(0), "                    0")
})

it('format(",d") can group thousands and space fill with overflow', () => {
  assert.strictEqual(format("1,d")(1), "1")
  assert.strictEqual(format("1,d")(1), "1")
  assert.strictEqual(format("2,d")(12), "12")
  assert.strictEqual(format("3,d")(123), "123")
  assert.strictEqual(format("5,d")(12345), "12,345")
  assert.strictEqual(format("8,d")(12345678), "12,345,678")
  assert.strictEqual(format("13,d")(1234567890123), "1,234,567,890,123")
})

it('format("<d") align left', () => {
  assert.strictEqual(format("<1,d")(0), "0")
  assert.strictEqual(format("<1,d")(0), "0")
  assert.strictEqual(format("<2,d")(0), "0 ")
  assert.strictEqual(format("<3,d")(0), "0  ")
  assert.strictEqual(format("<5,d")(0), "0    ")
  assert.strictEqual(format("<8,d")(0), "0       ")
  assert.strictEqual(format("<13,d")(0), "0            ")
  assert.strictEqual(format("<21,d")(0), "0                    ")
})

it('format(">d") align right', () => {
  assert.strictEqual(format(">1,d")(0), "0")
  assert.strictEqual(format(">1,d")(0), "0")
  assert.strictEqual(format(">2,d")(0), " 0")
  assert.strictEqual(format(">3,d")(0), "  0")
  assert.strictEqual(format(">5,d")(0), "    0")
  assert.strictEqual(format(">8,d")(0), "       0")
  assert.strictEqual(format(">13,d")(0), "            0")
  assert.strictEqual(format(">21,d")(0), "                    0")
  assert.strictEqual(format(">21,d")(1000), "                1,000")
  assert.strictEqual(format(">21,d")(1e21), "1,000,000,000,000,000,000,000")
})

it('format("^d") align center', () => {
  assert.strictEqual(format("^1,d")(0), "0")
  assert.strictEqual(format("^1,d")(0), "0")
  assert.strictEqual(format("^2,d")(0), "0 ")
  assert.strictEqual(format("^3,d")(0), " 0 ")
  assert.strictEqual(format("^5,d")(0), "  0  ")
  assert.strictEqual(format("^8,d")(0), "   0    ")
  assert.strictEqual(format("^13,d")(0), "      0      ")
  assert.strictEqual(format("^21,d")(0), "          0          ")
  assert.strictEqual(format("^21,d")(1000), "        1,000        ")
  assert.strictEqual(format("^21,d")(1e21), "1,000,000,000,000,000,000,000")
})

it('format("=+,d") pad after sign', () => {
  assert.strictEqual(format("=+1,d")(0), "+0")
  assert.strictEqual(format("=+1,d")(0), "+0")
  assert.strictEqual(format("=+2,d")(0), "+0")
  assert.strictEqual(format("=+3,d")(0), "+ 0")
  assert.strictEqual(format("=+5,d")(0), "+   0")
  assert.strictEqual(format("=+8,d")(0), "+      0")
  assert.strictEqual(format("=+13,d")(0), "+           0")
  assert.strictEqual(format("=+21,d")(0), "+                   0")
  assert.strictEqual(format("=+21,d")(1e21), "+1,000,000,000,000,000,000,000")
})

it('format("=+$,d") pad after sign with currency', () => {
  assert.strictEqual(format("=+$1,d")(0), "+$0")
  assert.strictEqual(format("=+$1,d")(0), "+$0")
  assert.strictEqual(format("=+$2,d")(0), "+$0")
  assert.strictEqual(format("=+$3,d")(0), "+$0")
  assert.strictEqual(format("=+$5,d")(0), "+$  0")
  assert.strictEqual(format("=+$8,d")(0), "+$     0")
  assert.strictEqual(format("=+$13,d")(0), "+$          0")
  assert.strictEqual(format("=+$21,d")(0), "+$                  0")
  assert.strictEqual(format("=+$21,d")(1e21), "+$1,000,000,000,000,000,000,000")
})

it('format(" ,d") a space can denote positive numbers', () => {
  assert.strictEqual(format(" 1,d")(-1), "−1")
  assert.strictEqual(format(" 1,d")(0), " 0")
  assert.strictEqual(format(" 2,d")(0), " 0")
  assert.strictEqual(format(" 3,d")(0), "  0")
  assert.strictEqual(format(" 5,d")(0), "    0")
  assert.strictEqual(format(" 8,d")(0), "       0")
  assert.strictEqual(format(" 13,d")(0), "            0")
  assert.strictEqual(format(" 21,d")(0), "                    0")
  assert.strictEqual(format(" 21,d")(1e21), " 1,000,000,000,000,000,000,000")
})

it('format("-,d") explicitly only use a sign for negative numbers', () => {
  assert.strictEqual(format("-1,d")(-1), "−1")
  assert.strictEqual(format("-1,d")(0), "0")
  assert.strictEqual(format("-2,d")(0), " 0")
  assert.strictEqual(format("-3,d")(0), "  0")
  assert.strictEqual(format("-5,d")(0), "    0")
  assert.strictEqual(format("-8,d")(0), "       0")
  assert.strictEqual(format("-13,d")(0), "            0")
  assert.strictEqual(format("-21,d")(0), "                    0")
})

it('format("d") can format negative zero as zero', () => {
  assert.strictEqual(format("1d")(-0), "0")
  assert.strictEqual(format("1d")(-1e-12), "0")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("e") can output exponent notation', () => {
  const f = format("e")
  assert.strictEqual(f(0), "0.000000e+0")
  assert.strictEqual(f(42), "4.200000e+1")
  assert.strictEqual(f(42000000), "4.200000e+7")
  assert.strictEqual(f(420000000), "4.200000e+8")
  assert.strictEqual(f(-4), "−4.000000e+0")
  assert.strictEqual(f(-42), "−4.200000e+1")
  assert.strictEqual(f(-4200000), "−4.200000e+6")
  assert.strictEqual(f(-42000000), "−4.200000e+7")
  assert.strictEqual(format(".0e")(42), "4e+1")
  assert.strictEqual(format(".3e")(42), "4.200e+1")
})

it('format("e") can format negative zero as zero', () => {
  assert.strictEqual(format("1e")(-0), "0.000000e+0")
  assert.strictEqual(format("1e")(-1e-12), "−1.000000e-12")
})

it('format(",e") does not group Infinity', () => {
  assert.strictEqual(format(",e")(Infinity), "Infinity")
})

it('format(".3e") can format negative infinity', () => {
  assert.strictEqual(format(".3e")(-Infinity), "−Infinity")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("f") can output fixed-point notation', () => {
  assert.strictEqual(format(".1f")(0.49), "0.5")
  assert.strictEqual(format(".2f")(0.449), "0.45")
  assert.strictEqual(format(".3f")(0.4449), "0.445")
  assert.strictEqual(format(".5f")(0.444449), "0.44445")
  assert.strictEqual(format(".1f")(100), "100.0")
  assert.strictEqual(format(".2f")(100), "100.00")
  assert.strictEqual(format(".3f")(100), "100.000")
  assert.strictEqual(format(".5f")(100), "100.00000")
})

it('format("+$,f") can output a currency with comma-grouping and sign', () => {
  const f = format("+$,.2f")
  assert.strictEqual(f(0), "+$0.00")
  assert.strictEqual(f(0.429), "+$0.43")
  assert.strictEqual(f(-0.429), "−$0.43")
  assert.strictEqual(f(-1), "−$1.00")
  assert.strictEqual(f(1e4), "+$10,000.00")
})

it('format(",.f") can group thousands, space fill, and round to significant digits', () => {
  assert.strictEqual(format("10,.1f")(123456.49), " 123,456.5")
  assert.strictEqual(format("10,.2f")(1234567.449), "1,234,567.45")
  assert.strictEqual(format("10,.3f")(12345678.4449), "12,345,678.445")
  assert.strictEqual(format("10,.5f")(123456789.444449), "123,456,789.44445")
  assert.strictEqual(format("10,.1f")(123456), " 123,456.0")
  assert.strictEqual(format("10,.2f")(1234567), "1,234,567.00")
  assert.strictEqual(format("10,.3f")(12345678), "12,345,678.000")
  assert.strictEqual(format("10,.5f")(123456789), "123,456,789.00000")
})

it('format("f") can display integers in fixed-point notation', () => {
  assert.strictEqual(format("f")(42), "42.000000")
})

it('format("f") can format negative zero as zero', () => {
  assert.strictEqual(format("f")(-0), "0.000000")
  assert.strictEqual(format("f")(-1e-12), "0.000000")
})

it('format("+f") signs negative zero correctly', () => {
  assert.strictEqual(format("+f")(-0), "−0.000000")
  assert.strictEqual(format("+f")(+0), "+0.000000")
  assert.strictEqual(format("+f")(-1e-12), "−0.000000")
  assert.strictEqual(format("+f")(+1e-12), "+0.000000")
})

it('format("f") can format negative infinity', () => {
  assert.strictEqual(format("f")(-Infinity), "−Infinity")
})

it('format(",f") does not group Infinity', () => {
  assert.strictEqual(format(",f")(Infinity), "Infinity")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("g") can output general notation', () => {
  assert.strictEqual(format(".1g")(0.049), "0.05")
  assert.strictEqual(format(".1g")(0.49), "0.5")
  assert.strictEqual(format(".2g")(0.449), "0.45")
  assert.strictEqual(format(".3g")(0.4449), "0.445")
  assert.strictEqual(format(".5g")(0.444449), "0.44445")
  assert.strictEqual(format(".1g")(100), "1e+2")
  assert.strictEqual(format(".2g")(100), "1.0e+2")
  assert.strictEqual(format(".3g")(100), "100")
  assert.strictEqual(format(".5g")(100), "100.00")
  assert.strictEqual(format(".5g")(100.2), "100.20")
  assert.strictEqual(format(".2g")(0.002), "0.0020")
})

it('format(",g") can group thousands with general notation', () => {
  const f = format(",.12g")
  assert.strictEqual(f(0), "0.00000000000")
  assert.strictEqual(f(42), "42.0000000000")
  assert.strictEqual(f(42000000), "42,000,000.0000")
  assert.strictEqual(f(420000000), "420,000,000.000")
  assert.strictEqual(f(-4), "−4.00000000000")
  assert.strictEqual(f(-42), "−42.0000000000")
  assert.strictEqual(f(-4200000), "−4,200,000.00000")
  assert.strictEqual(f(-42000000), "−42,000,000.0000")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("n") is an alias for ",g"', () => {
  const f = format(".12n")
  assert.strictEqual(f(0), "0.00000000000")
  assert.strictEqual(f(42), "42.0000000000")
  assert.strictEqual(f(42000000), "42,000,000.0000")
  assert.strictEqual(f(420000000), "420,000,000.000")
  assert.strictEqual(f(-4), "−4.00000000000")
  assert.strictEqual(f(-42), "−42.0000000000")
  assert.strictEqual(f(-4200000), "−4,200,000.00000")
  assert.strictEqual(f(-42000000), "−42,000,000.0000")
  assert.strictEqual(f(0.0042), "0.00420000000000")
  assert.strictEqual(f(0.42), "0.420000000000")
  assert.strictEqual(f(1e21), "1.00000000000e+21")
})

it('format("n") uses zero padding', () => {
  assert.strictEqual(format("01.0n")(0), "0")
  assert.strictEqual(format("02.0n")(0), "00")
  assert.strictEqual(format("03.0n")(0), "000")
  assert.strictEqual(format("05.0n")(0), "0,000")
  assert.strictEqual(format("08.0n")(0), "0,000,000")
  assert.strictEqual(format("013.0n")(0), "0,000,000,000")
  assert.strictEqual(format("021.0n")(0), "0,000,000,000,000,000")
  assert.strictEqual(format("013.8n")(-42000000), "−0,042,000,000")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format(".[precision]") uses significant precision and trims insignificant zeros', () => {
  assert.strictEqual(format(".1")(4.9), "5")
  assert.strictEqual(format(".1")(0.49), "0.5")
  assert.strictEqual(format(".2")(4.9), "4.9")
  assert.strictEqual(format(".2")(0.49), "0.49")
  assert.strictEqual(format(".2")(0.449), "0.45")
  assert.strictEqual(format(".3")(4.9), "4.9")
  assert.strictEqual(format(".3")(0.49), "0.49")
  assert.strictEqual(format(".3")(0.449), "0.449")
  assert.strictEqual(format(".3")(0.4449), "0.445")
  assert.strictEqual(format(".5")(0.444449), "0.44445")
})

it('format(".[precision]") does not trim significant zeros', () => {
  assert.strictEqual(format(".5")(10), "10")
  assert.strictEqual(format(".5")(100), "100")
  assert.strictEqual(format(".5")(1000), "1000")
  assert.strictEqual(format(".5")(21010), "21010")
  assert.strictEqual(format(".5")(1.10001), "1.1")
  assert.strictEqual(format(".5")(1.10001e6), "1.1e+6")
  assert.strictEqual(format(".6")(1.10001), "1.10001")
  assert.strictEqual(format(".6")(1.10001e6), "1.10001e+6")
})

it('format(".[precision]") also trims the decimal point if there are only insignificant zeros', () => {
  assert.strictEqual(format(".5")(1.00001), "1")
  assert.strictEqual(format(".5")(1.00001e6), "1e+6")
  assert.strictEqual(format(".6")(1.00001), "1.00001")
  assert.strictEqual(format(".6")(1.00001e6), "1.00001e+6")
})

it('format("$") can output a currency', () => {
  const f = format("$")
  assert.strictEqual(f(0), "$0")
  assert.strictEqual(f(0.042), "$0.042")
  assert.strictEqual(f(0.42), "$0.42")
  assert.strictEqual(f(4.2), "$4.2")
  assert.strictEqual(f(-0.042), "−$0.042")
  assert.strictEqual(f(-0.42), "−$0.42")
  assert.strictEqual(f(-4.2), "−$4.2")
})

it('format("($") can output a currency with parentheses for negative values', () => {
  const f = format("($")
  assert.strictEqual(f(0), "$0")
  assert.strictEqual(f(0.042), "$0.042")
  assert.strictEqual(f(0.42), "$0.42")
  assert.strictEqual(f(4.2), "$4.2")
  assert.strictEqual(f(-0.042), "($0.042)")
  assert.strictEqual(f(-0.42), "($0.42)")
  assert.strictEqual(f(-4.2), "($4.2)")
})

it('format("") can format negative zero as zero', () => {
  assert.strictEqual(format("")(-0), "0")
})

it('format("") can format negative infinity', () => {
  assert.strictEqual(format("")(-Infinity), "−Infinity")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("o") octal', () => {
  assert.strictEqual(format("o")(10), "12")
})

it('format("#o") octal with prefix', () => {
  assert.strictEqual(format("#o")(10), "0o12")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("p") can output a percentage', () => {
  const f = format("p")
  assert.strictEqual(f(0.00123), "0.123000%")
  assert.strictEqual(f(0.0123), "1.23000%")
  assert.strictEqual(f(0.123), "12.3000%")
  assert.strictEqual(f(0.234), "23.4000%")
  assert.strictEqual(f(1.23), "123.000%")
  assert.strictEqual(f(-0.00123), "−0.123000%")
  assert.strictEqual(f(-0.0123), "−1.23000%")
  assert.strictEqual(f(-0.123), "−12.3000%")
  assert.strictEqual(f(-1.23), "−123.000%")
})

it('format("+p") can output a percentage with rounding and sign', () => {
  const f = format("+.2p")
  assert.strictEqual(f(0.00123), "+0.12%")
  assert.strictEqual(f(0.0123), "+1.2%")
  assert.strictEqual(f(0.123), "+12%")
  assert.strictEqual(f(1.23), "+120%")
  assert.strictEqual(f(-0.00123), "−0.12%")
  assert.strictEqual(f(-0.0123), "−1.2%")
  assert.strictEqual(f(-0.123), "−12%")
  assert.strictEqual(f(-1.23), "−120%")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("r") can round to significant digits', () => {
  assert.strictEqual(format(".2r")(0), "0.0")
  assert.strictEqual(format(".1r")(0.049), "0.05")
  assert.strictEqual(format(".1r")(-0.049), "−0.05")
  assert.strictEqual(format(".1r")(0.49), "0.5")
  assert.strictEqual(format(".1r")(-0.49), "−0.5")
  assert.strictEqual(format(".2r")(0.449), "0.45")
  assert.strictEqual(format(".3r")(0.4449), "0.445")
  assert.strictEqual(format(".3r")(1.0), "1.00")
  assert.strictEqual(format(".3r")(0.9995), "1.00")
  assert.strictEqual(format(".5r")(0.444449), "0.44445")
  assert.strictEqual(format("r")(123.45), "123.450")
  assert.strictEqual(format(".1r")(123.45), "100")
  assert.strictEqual(format(".2r")(123.45), "120")
  assert.strictEqual(format(".3r")(123.45), "123")
  assert.strictEqual(format(".4r")(123.45), "123.5")
  assert.strictEqual(format(".5r")(123.45), "123.45")
  assert.strictEqual(format(".6r")(123.45), "123.450")
  assert.strictEqual(format(".1r")(0.9), "0.9")
  assert.strictEqual(format(".1r")(0.09), "0.09")
  assert.strictEqual(format(".1r")(0.949), "0.9")
  assert.strictEqual(format(".1r")(0.0949), "0.09")
  assert.strictEqual(format(".1r")(0.0000000129), "0.00000001")
  assert.strictEqual(format(".2r")(0.0000000129), "0.000000013")
  assert.strictEqual(format(".2r")(0.00000000129), "0.0000000013")
  assert.strictEqual(format(".3r")(0.00000000129), "0.00000000129")
  assert.strictEqual(format(".4r")(0.00000000129), "0.000000001290")
  assert.strictEqual(format(".10r")(0.9999999999), "0.9999999999")
  assert.strictEqual(format(".15r")(0.999999999999999), "0.999999999999999")
})

it('format("r") can round very small numbers', () => {
  const f = format(".2r")
  assert.strictEqual(f(1e-22), "0.00000000000000000000010")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("s") outputs SI-prefix notation with default precision 6', () => {
  const f = format("s")
  assert.strictEqual(f(0), "0.00000")
  assert.strictEqual(f(1), "1.00000")
  assert.strictEqual(f(10), "10.0000")
  assert.strictEqual(f(100), "100.000")
  assert.strictEqual(f(999.5), "999.500")
  assert.strictEqual(f(999500), "999.500k")
  assert.strictEqual(f(1000), "1.00000k")
  assert.strictEqual(f(100), "100.000")
  assert.strictEqual(f(1400), "1.40000k")
  assert.strictEqual(f(1500.5), "1.50050k")
  assert.strictEqual(f(0.00001), "10.0000µ")
  assert.strictEqual(f(0.000001), "1.00000µ")
})

it('format("[.precision]s") outputs SI-prefix notation with precision significant digits', () => {
  const f1 = format(".3s")
  assert.strictEqual(f1(0), "0.00")
  assert.strictEqual(f1(1), "1.00")
  assert.strictEqual(f1(10), "10.0")
  assert.strictEqual(f1(100), "100")
  assert.strictEqual(f1(999.5), "1.00k")
  assert.strictEqual(f1(999500), "1.00M")
  assert.strictEqual(f1(1000), "1.00k")
  assert.strictEqual(f1(1500.5), "1.50k")
  assert.strictEqual(f1(145500000), "146M")
  assert.strictEqual(f1(145999999.99999347), "146M")
  assert.strictEqual(f1(1e26), "100Y")
  assert.strictEqual(f1(0.000001), "1.00µ")
  assert.strictEqual(f1(0.009995), "10.0m")
  const f2 = format(".4s")
  assert.strictEqual(f2(999.5), "999.5")
  assert.strictEqual(f2(999500), "999.5k")
  assert.strictEqual(f2(0.009995), "9.995m")
})

it('format("s") formats numbers smaller than 1e-24 with yocto', () => {
  const f = format(".8s")
  assert.strictEqual(f(1.29e-30), "0.0000013y") // Note: rounded!
  assert.strictEqual(f(1.29e-29), "0.0000129y")
  assert.strictEqual(f(1.29e-28), "0.0001290y")
  assert.strictEqual(f(1.29e-27), "0.0012900y")
  assert.strictEqual(f(1.29e-26), "0.0129000y")
  assert.strictEqual(f(1.29e-25), "0.1290000y")
  assert.strictEqual(f(1.29e-24), "1.2900000y")
  assert.strictEqual(f(1.29e-23), "12.900000y")
  assert.strictEqual(f(1.29e-22), "129.00000y")
  assert.strictEqual(f(1.29e-21), "1.2900000z")
  assert.strictEqual(f(-1.29e-30), "−0.0000013y") // Note: rounded!
  assert.strictEqual(f(-1.29e-29), "−0.0000129y")
  assert.strictEqual(f(-1.29e-28), "−0.0001290y")
  assert.strictEqual(f(-1.29e-27), "−0.0012900y")
  assert.strictEqual(f(-1.29e-26), "−0.0129000y")
  assert.strictEqual(f(-1.29e-25), "−0.1290000y")
  assert.strictEqual(f(-1.29e-24), "−1.2900000y")
  assert.strictEqual(f(-1.29e-23), "−12.900000y")
  assert.strictEqual(f(-1.29e-22), "−129.00000y")
  assert.strictEqual(f(-1.29e-21), "−1.2900000z")
})

it('format("s") formats numbers larger than 1e24 with yotta', () => {
  const f = format(".8s")
  assert.strictEqual(f(1.23e21), "1.2300000Z")
  assert.strictEqual(f(1.23e22), "12.300000Z")
  assert.strictEqual(f(1.23e23), "123.00000Z")
  assert.strictEqual(f(1.23e24), "1.2300000Y")
  assert.strictEqual(f(1.23e25), "12.300000Y")
  assert.strictEqual(f(1.23e26), "123.00000Y")
  assert.strictEqual(f(1.23e27), "1230.0000Y")
  assert.strictEqual(f(1.23e28), "12300.000Y")
  assert.strictEqual(f(1.23e29), "123000.00Y")
  assert.strictEqual(f(1.23e30), "1230000.0Y")
  assert.strictEqual(f(-1.23e21), "−1.2300000Z")
  assert.strictEqual(f(-1.23e22), "−12.300000Z")
  assert.strictEqual(f(-1.23e23), "−123.00000Z")
  assert.strictEqual(f(-1.23e24), "−1.2300000Y")
  assert.strictEqual(f(-1.23e25), "−12.300000Y")
  assert.strictEqual(f(-1.23e26), "−123.00000Y")
  assert.strictEqual(f(-1.23e27), "−1230.0000Y")
  assert.strictEqual(f(-1.23e28), "−12300.000Y")
  assert.strictEqual(f(-1.23e29), "−123000.00Y")
  assert.strictEqual(f(-1.23e30), "−1230000.0Y")
})

it('format("$s") outputs SI-prefix notation with a currency symbol', () => {
  const f1 = format("$.2s")
  assert.strictEqual(f1(0), "$0.0")
  assert.strictEqual(f1(2.5e5), "$250k")
  assert.strictEqual(f1(-2.5e8), "−$250M")
  assert.strictEqual(f1(2.5e11), "$250G")
  const f2 = format("$.3s")
  assert.strictEqual(f2(0), "$0.00")
  assert.strictEqual(f2(1), "$1.00")
  assert.strictEqual(f2(10), "$10.0")
  assert.strictEqual(f2(100), "$100")
  assert.strictEqual(f2(999.5), "$1.00k")
  assert.strictEqual(f2(999500), "$1.00M")
  assert.strictEqual(f2(1000), "$1.00k")
  assert.strictEqual(f2(1500.5), "$1.50k")
  assert.strictEqual(f2(145500000), "$146M")
  assert.strictEqual(f2(145999999.9999347), "$146M")
  assert.strictEqual(f2(1e26), "$100Y")
  assert.strictEqual(f2(0.000001), "$1.00µ")
  assert.strictEqual(f2(0.009995), "$10.0m")
  const f3 = format("$.4s")
  assert.strictEqual(f3(999.5), "$999.5")
  assert.strictEqual(f3(999500), "$999.5k")
  assert.strictEqual(f3(0.009995), "$9.995m")
})

it('format("s") SI-prefix notation precision is consistent for small and large numbers', () => {
  const f1 = format(".0s")
  assert.strictEqual(f1(1e-5), "10µ")
  assert.strictEqual(f1(1e-4), "100µ")
  assert.strictEqual(f1(1e-3), "1m")
  assert.strictEqual(f1(1e-2), "10m")
  assert.strictEqual(f1(1e-1), "100m")
  assert.strictEqual(f1(1), "1")
  assert.strictEqual(f1(1e1), "10")
  assert.strictEqual(f1(1e2), "100")
  assert.strictEqual(f1(1e3), "1k")
  assert.strictEqual(f1(1e4), "10k")
  assert.strictEqual(f1(1e5), "100k")
  const f2 = format(".4s")
  assert.strictEqual(f2(1e-5), "10.00µ")
  assert.strictEqual(f2(1e-4), "100.0µ")
  assert.strictEqual(f2(1e-3), "1.000m")
  assert.strictEqual(f2(1e-2), "10.00m")
  assert.strictEqual(f2(1e-1), "100.0m")
  assert.strictEqual(f2(1), "1.000")
  assert.strictEqual(f2(1e1), "10.00")
  assert.strictEqual(f2(1e2), "100.0")
  assert.strictEqual(f2(1e3), "1.000k")
  assert.strictEqual(f2(1e4), "10.00k")
  assert.strictEqual(f2(1e5), "100.0k")
})

it('format("0[width],s") will group thousands due to zero fill', () => {
  const f = format("020,s")
  assert.strictEqual(f(42), "000,000,000,042.0000")
  assert.strictEqual(f(42e12), "00,000,000,042.0000T")
})

it('format(",s") will group thousands for very large numbers', () => {
  const f = format(",s")
  assert.strictEqual(f(42e30), "42,000,000Y")
})
import assert from "assert"
import { format } from "../src/index.js"

it('format("x") returns the expected hexadecimal (lowercase) string', () => {
  assert.strictEqual(format("x")(0xdeadbeef), "deadbeef")
})

it('format("#x") returns the expected hexadecimal (lowercase) string with prefix', () => {
  assert.strictEqual(format("#x")(0xdeadbeef), "0xdeadbeef")
})

it('format(",x") groups thousands', () => {
  assert.strictEqual(format(",x")(0xdeadbeef), "de,adb,eef")
})

it('format(",x") groups thousands', () => {
  assert.strictEqual(format(",x")(0xdeadbeef), "de,adb,eef")
})

it('format("#,x") does not group the prefix', () => {
  assert.strictEqual(format("#,x")(0xadeadbeef), "0xade,adb,eef")
})

it('format("+#x") puts the sign before the prefix', () => {
  assert.strictEqual(format("+#x")(0xdeadbeef), "+0xdeadbeef")
  assert.strictEqual(format("+#x")(-0xdeadbeef), "−0xdeadbeef")
  assert.strictEqual(format(" #x")(0xdeadbeef), " 0xdeadbeef")
  assert.strictEqual(format(" #x")(-0xdeadbeef), "−0xdeadbeef")
})

it('format("$,x") formats hexadecimal currency', () => {
  assert.strictEqual(format("$,x")(0xdeadbeef), "$de,adb,eef")
})

it('format("[.precision]x") always has precision zero', () => {
  assert.strictEqual(format(".2x")(0xdeadbeef), "deadbeef")
  assert.strictEqual(format(".2x")(-4.2), "−4")
})

it('format("x") rounds non-integers', () => {
  assert.strictEqual(format("x")(2.4), "2")
})

it('format("x") can format negative zero as zero', () => {
  assert.strictEqual(format("x")(-0), "0")
  assert.strictEqual(format("x")(-1e-12), "0")
})

it('format("x") does not consider -0xeee to be positive', () => {
  assert.strictEqual(format("x")(-0xeee), "−eee")
})

it('format("X") returns the expected hexadecimal (uppercase) string', () => {
  assert.strictEqual(format("X")(0xdeadbeef), "DEADBEEF")
})

it('format("#X") returns the expected hexadecimal (uppercase) string with prefix', () => {
  assert.strictEqual(format("#X")(0xdeadbeef), "0xDEADBEEF")
})

it('format("X") can format negative zero as zero', () => {
  assert.strictEqual(format("X")(-0), "0")
  assert.strictEqual(format("X")(-1e-12), "0")
})

it('format("X") does not consider -0xeee to be positive', () => {
  assert.strictEqual(format("X")(-0xeee), "−EEE")
})

it('format("#[width]x") considers the prefix', () => {
  assert.strictEqual(format("20x")(0xdeadbeef), "            deadbeef")
  assert.strictEqual(format("#20x")(0xdeadbeef), "          0xdeadbeef")
  assert.strictEqual(format("020x")(0xdeadbeef), "000000000000deadbeef")
  assert.strictEqual(format("#020x")(0xdeadbeef), "0x0000000000deadbeef")
})
import assert from "assert"
import { formatPrefix } from "../src/index.js"

it('formatPrefix("s", value)(number) formats with the SI prefix appropriate to the specified value', () => {
  assert.strictEqual(formatPrefix(",.0s", 1e-6)(0.00042), "420µ")
  assert.strictEqual(formatPrefix(",.0s", 1e-6)(0.0042), "4,200µ")
  assert.strictEqual(formatPrefix(",.3s", 1e-3)(0.00042), "0.420m")
})

it('formatPrefix("s", value)(number) uses yocto for very small reference values', () => {
  assert.strictEqual(formatPrefix(",.0s", 1e-27)(1e-24), "1y")
})

it('formatPrefix("s", value)(number) uses yotta for very small reference values', () => {
  assert.strictEqual(formatPrefix(",.0s", 1e27)(1e24), "1Y")
})

it('formatPrefix("$,s", value)(number) formats with the specified SI prefix', () => {
  const f = formatPrefix(" $12,.1s", 1e6)
  assert.strictEqual(f(-42e6), "      −$42.0M")
  assert.strictEqual(f(+4.2e6), "        $4.2M")
})
import assert from "assert"
import { format, formatSpecifier, FormatSpecifier } from "../src/index.js"

it("formatSpecifier(specifier) throws an error for invalid formats", () => {
  assert.throws(() => {
    formatSpecifier("foo")
  }, /invalid format: foo/)
  assert.throws(() => {
    formatSpecifier(".-2s")
  }, /invalid format: \.-2s/)
  assert.throws(() => {
    formatSpecifier(".f")
  }, /invalid format: \.f/)
})

it("formatSpecifier(specifier) returns an instanceof formatSpecifier", () => {
  const s = formatSpecifier("")
  assert.strictEqual(s instanceof formatSpecifier, true)
})

it('formatSpecifier("") has the expected defaults', () => {
  const s = formatSpecifier("")
  assert.strictEqual(s.fill, " ")
  assert.strictEqual(s.align, ">")
  assert.strictEqual(s.sign, "-")
  assert.strictEqual(s.symbol, "")
  assert.strictEqual(s.zero, false)
  assert.strictEqual(s.width, undefined)
  assert.strictEqual(s.comma, false)
  assert.strictEqual(s.precision, undefined)
  assert.strictEqual(s.trim, false)
  assert.strictEqual(s.type, "")
})

it("formatSpecifier(specifier) preserves unknown types", () => {
  const s = formatSpecifier("q")
  assert.strictEqual(s.trim, false)
  assert.strictEqual(s.type, "q")
})

it("formatSpecifier(specifier) preserves shorthand", () => {
  const s = formatSpecifier("")
  assert.strictEqual(s.trim, false)
  assert.strictEqual(s.type, "")
})

it("formatSpecifier(specifier).toString() reflects current field values", () => {
  const s = formatSpecifier("")
  assert.strictEqual(((s.fill = "_"), s) + "", "_>-")
  assert.strictEqual(((s.align = "^"), s) + "", "_^-")
  assert.strictEqual(((s.sign = "+"), s) + "", "_^+")
  assert.strictEqual(((s.symbol = "$"), s) + "", "_^+$")
  assert.strictEqual(((s.zero = true), s) + "", "_^+$0")
  assert.strictEqual(((s.width = 12), s) + "", "_^+$012")
  assert.strictEqual(((s.comma = true), s) + "", "_^+$012,")
  assert.strictEqual(((s.precision = 2), s) + "", "_^+$012,.2")
  assert.strictEqual(((s.type = "f"), s) + "", "_^+$012,.2f")
  assert.strictEqual(((s.trim = true), s) + "", "_^+$012,.2~f")
  assert.strictEqual(format(s)(42), "+$0,000,000,042")
})

it("formatSpecifier(specifier).toString() clamps precision to zero", () => {
  const s = formatSpecifier("")
  assert.strictEqual(((s.precision = -1), s) + "", " >-.0")
})

it("formatSpecifier(specifier).toString() clamps width to one", () => {
  const s = formatSpecifier("")
  assert.strictEqual(((s.width = -1), s) + "", " >-1")
})

it("new FormatSpecifier({}) has the expected defaults", () => {
  const s = new FormatSpecifier({})
  assert.strictEqual(s.fill, " ")
  assert.strictEqual(s.align, ">")
  assert.strictEqual(s.sign, "-")
  assert.strictEqual(s.symbol, "")
  assert.strictEqual(s.zero, false)
  assert.strictEqual(s.width, undefined)
  assert.strictEqual(s.comma, false)
  assert.strictEqual(s.precision, undefined)
  assert.strictEqual(s.trim, false)
  assert.strictEqual(s.type, "")
})

it("new FormatSpecifier({…}) coerces all inputs to the expected types", () => {
  const s = new FormatSpecifier({
    fill: 1,
    align: 2,
    sign: 3,
    symbol: 4,
    zero: 5,
    width: 6,
    comma: 7,
    precision: 8,
    trim: 9,
    type: 10,
  })
  assert.strictEqual(s.fill, "1")
  assert.strictEqual(s.align, "2")
  assert.strictEqual(s.sign, "3")
  assert.strictEqual(s.symbol, "4")
  assert.strictEqual(s.zero, true)
  assert.strictEqual(s.width, 6)
  assert.strictEqual(s.comma, true)
  assert.strictEqual(s.precision, 8)
  assert.strictEqual(s.trim, true)
  assert.strictEqual(s.type, "10")
})
import assert from "assert"
import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { formatLocale } from "../src/index.js"

function locale(locale) {
  return formatLocale(JSON.parse(readFileSync(`./locale/${locale}.json`, "utf8")))
}

it("formatLocale({decimal: decimal}) observes the specified decimal point", () => {
  assert.strictEqual(formatLocale({ decimal: "|" }).format("06.2f")(2), "002|00")
  assert.strictEqual(formatLocale({ decimal: "/" }).format("06.2f")(2), "002/00")
})

it("formatLocale({currency: [prefix, suffix]}) observes the specified currency prefix and suffix", () => {
  assert.strictEqual(formatLocale({ decimal: ".", currency: ["฿", ""] }).format("$06.2f")(2), "฿02.00")
  assert.strictEqual(formatLocale({ decimal: ".", currency: ["", "฿"] }).format("$06.2f")(2), "02.00฿")
})

it("formatLocale({currency: [prefix, suffix]}) places the currency suffix after the SI suffix", () => {
  assert.strictEqual(formatLocale({ decimal: ",", currency: ["", " €"] }).format("$.3s")(1.2e9), "1,20G €")
})

it("formatLocale({grouping: undefined}) does not perform any grouping", () => {
  assert.strictEqual(formatLocale({ decimal: "." }).format("012,.2f")(2), "000000002.00")
})

it("formatLocale({grouping: [sizes…]}) observes the specified group sizes", () => {
  assert.strictEqual(formatLocale({ decimal: ".", grouping: [3], thousands: "," }).format("012,.2f")(2), "0,000,002.00")
  assert.strictEqual(
    formatLocale({ decimal: ".", grouping: [2], thousands: "," }).format("012,.2f")(2),
    "0,00,00,02.00"
  )
  assert.strictEqual(
    formatLocale({ decimal: ".", grouping: [2, 3], thousands: "," }).format("012,.2f")(2),
    "00,000,02.00"
  )
  assert.strictEqual(
    formatLocale({ decimal: ".", grouping: [3, 2, 2, 2, 2, 2, 2], thousands: "," }).format(",d")(1e12),
    "10,00,00,00,00,000"
  )
})

it("formatLocale(…) can format numbers using the Indian numbering system.", () => {
  const format = locale("en-IN").format(",")
  assert.strictEqual(format(10), "10")
  assert.strictEqual(format(100), "100")
  assert.strictEqual(format(1000), "1,000")
  assert.strictEqual(format(10000), "10,000")
  assert.strictEqual(format(100000), "1,00,000")
  assert.strictEqual(format(1000000), "10,00,000")
  assert.strictEqual(format(10000000), "1,00,00,000")
  assert.strictEqual(format(10000000.4543), "1,00,00,000.4543")
  assert.strictEqual(format(1000.321), "1,000.321")
  assert.strictEqual(format(10.5), "10.5")
  assert.strictEqual(format(-10), "−10")
  assert.strictEqual(format(-100), "−100")
  assert.strictEqual(format(-1000), "−1,000")
  assert.strictEqual(format(-10000), "−10,000")
  assert.strictEqual(format(-100000), "−1,00,000")
  assert.strictEqual(format(-1000000), "−10,00,000")
  assert.strictEqual(format(-10000000), "−1,00,00,000")
  assert.strictEqual(format(-10000000.4543), "−1,00,00,000.4543")
  assert.strictEqual(format(-1000.321), "−1,000.321")
  assert.strictEqual(format(-10.5), "−10.5")
})

it("formatLocale({thousands: separator}) observes the specified group separator", () => {
  assert.strictEqual(formatLocale({ decimal: ".", grouping: [3], thousands: " " }).format("012,.2f")(2), "0 000 002.00")
  assert.strictEqual(formatLocale({ decimal: ".", grouping: [3], thousands: "/" }).format("012,.2f")(2), "0/000/002.00")
})

it("formatLocale({percent: percent}) observes the specified percent sign", () => {
  assert.strictEqual(formatLocale({ decimal: ".", percent: "!" }).format("06.2%")(2), "200.00!")
  assert.strictEqual(formatLocale({ decimal: ".", percent: "﹪" }).format("06.2%")(2), "200.00﹪")
})

it("formatLocale({minus: minus}) observes the specified minus sign", () => {
  assert.strictEqual(formatLocale({ decimal: ".", minus: "-" }).format("06.2f")(-2), "-02.00")
  assert.strictEqual(formatLocale({ decimal: ".", minus: "−" }).format("06.2f")(-2), "−02.00")
  assert.strictEqual(formatLocale({ decimal: ".", minus: "➖" }).format("06.2f")(-2), "➖02.00")
  assert.strictEqual(formatLocale({ decimal: "." }).format("06.2f")(-2), "−02.00")
})

it("formatLocale({nan: nan}) observes the specified not-a-number representation", () => {
  assert.strictEqual(formatLocale({ nan: "N/A" }).format("6.2f")(undefined), "   N/A")
  assert.strictEqual(formatLocale({ nan: "-" }).format("<6.2g")(undefined), "-     ")
  assert.strictEqual(formatLocale({}).format(" 6.2f")(undefined), "   NaN")
})

it("locale data is valid", async () => {
  for (const file of readdirSync("locale")) {
    if (!/\.json$/i.test(file)) continue
    const locale = JSON.parse(readFileSync(join("locale", file), "utf8"))
    assert.strictEqual("currency" in locale, true)
    assert.strictEqual("decimal" in locale, true)
    assert.strictEqual("grouping" in locale, true)
    assert.strictEqual("thousands" in locale, true)
    formatLocale(locale)
  }
})
import assert from "assert"
import { precisionFixed } from "../src/index.js"

it("precisionFixed(number) returns the expected value", () => {
  assert.strictEqual(precisionFixed(8.9), 0)
  assert.strictEqual(precisionFixed(1.1), 0)
  assert.strictEqual(precisionFixed(0.89), 1)
  assert.strictEqual(precisionFixed(0.11), 1)
  assert.strictEqual(precisionFixed(0.089), 2)
  assert.strictEqual(precisionFixed(0.011), 2)
})
import assert from "assert"
import { precisionPrefix } from "../src/index.js"

// A generalization from µ to all prefixes:
// assert.strictEqual(precisionPrefix(1e-6, 1e-6), 0); // 1µ
// assert.strictEqual(precisionPrefix(1e-6, 1e-7), 0); // 10µ
// assert.strictEqual(precisionPrefix(1e-6, 1e-8), 0); // 100µ
it("precisionPrefix(step, value) returns zero if step has the same units as value", () => {
  for (var i = -24; i <= 24; i += 3) {
    for (var j = i; j < i + 3; ++j) {
      assert.strictEqual(precisionPrefix(+("1e" + i), +("1e" + j)), 0)
    }
  }
})

// A generalization from µ to all prefixes:
// assert.strictEqual(precisionPrefix(1e-9, 1e-6), 3); // 0.001µ
// assert.strictEqual(precisionPrefix(1e-8, 1e-6), 2); // 0.01µ
// assert.strictEqual(precisionPrefix(1e-7, 1e-6), 1); // 0.1µ
it("precisionPrefix(step, value) returns greater than zero if fractional digits are needed", () => {
  for (var i = -24; i <= 24; i += 3) {
    for (var j = i - 4; j < i; ++j) {
      assert.strictEqual(precisionPrefix(+("1e" + j), +("1e" + i)), i - j)
    }
  }
})

it("precisionPrefix(step, value) returns the expected precision when value is less than one yocto", () => {
  assert.strictEqual(precisionPrefix(1e-24, 1e-24), 0) // 1y
  assert.strictEqual(precisionPrefix(1e-25, 1e-25), 1) // 0.1y
  assert.strictEqual(precisionPrefix(1e-26, 1e-26), 2) // 0.01y
  assert.strictEqual(precisionPrefix(1e-27, 1e-27), 3) // 0.001y
  assert.strictEqual(precisionPrefix(1e-28, 1e-28), 4) // 0.0001y
})

it("precisionPrefix(step, value) returns the expected precision when value is greater than than one yotta", () => {
  assert.strictEqual(precisionPrefix(1e24, 1e24), 0) // 1Y
  assert.strictEqual(precisionPrefix(1e24, 1e25), 0) // 10Y
  assert.strictEqual(precisionPrefix(1e24, 1e26), 0) // 100Y
  assert.strictEqual(precisionPrefix(1e24, 1e27), 0) // 1000Y
  assert.strictEqual(precisionPrefix(1e23, 1e27), 1) // 1000.0Y
})
import assert from "assert"
import { precisionRound } from "../src/index.js"

it("precisionRound(step, max) returns the expected value", () => {
  assert.strictEqual(precisionRound(0.1, 1.1), 2) // "1.0", "1.1"
  assert.strictEqual(precisionRound(0.01, 0.99), 2) // "0.98", "0.99"
  assert.strictEqual(precisionRound(0.01, 1.0), 2) // "0.99", "1.0"
  assert.strictEqual(precisionRound(0.01, 1.01), 3) // "1.00", "1.01"
})
