const formatISO = ts => {
  const date = new Date(ts)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const locale = 'it-IT'

const formatHumanReadable = ts =>
  new Date(ts).toLocaleString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const now = Date.now()

export const isoDate = formatISO(now)
export const humanReadableDate = formatHumanReadable(now)

const currentYear = new Date(now).getFullYear()
const monthNameToIndex = {}

for (const index of [...Array(11)].map((_, index) => index)) {
  const month = new Date(currentYear, index)

  monthNameToIndex[month.toLocaleString(locale, { month: 'long' })] = index
  monthNameToIndex[month.toLocaleString(locale, { month: 'short' })] = index
}

const day = '[0-9]{1,2}'
const month = `${Object.keys(monthNameToIndex).join('|')}|[0-9]{1,2}`
const year = '[0-9]{4}'
const sep = '[\\s\\-/.,\\\\]'
const date = `(${day})${sep}+(${month})(${sep}+(${year}))?`
const dateRegex = new RegExp(date, 'i')

export const parseLocaleDate = str => {
  const [, rawDay, rawMonth, , rawYear] = str.match(dateRegex) ?? []

  if (rawDay == null || rawMonth == null) {
    return null
  }

  const year = rawYear == null ? currentYear : parseInt(rawYear)

  const month = isNaN(rawMonth)
    ? monthNameToIndex[rawMonth.toLocaleLowerCase()]
    : parseInt(rawMonth) - 1

  if (month < 0 || month > 11) {
    return null
  }

  const day = parseInt(rawDay)

  if (day < 1 || day > 31) {
    return null
  }

  return new Date(year, month, day)
}
