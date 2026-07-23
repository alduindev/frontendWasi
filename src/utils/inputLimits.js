export function limitText(maxLength) {
  return (event) => {
    event.currentTarget.value = event.currentTarget.value.slice(0, maxLength)
  }
}

export function limitInteger(maxDigits) {
  return (event) => {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '').slice(0, maxDigits)
  }
}

export function limitDecimal(maxIntegerDigits, maxDecimalDigits = 2) {
  return (event) => {
    const normalized = event.currentTarget.value.replace(',', '.').replace(/[^\d.]/g, '')
    const [integer = '', decimal = ''] = normalized.split('.')
    event.currentTarget.value = decimal || normalized.includes('.')
      ? `${integer.slice(0, maxIntegerDigits)}.${decimal.slice(0, maxDecimalDigits)}`
      : integer.slice(0, maxIntegerDigits)
  }
}
