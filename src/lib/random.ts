export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const hashString = (input: string): number => {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomBetween = (random: () => number, min: number, max: number) => min + random() * (max - min)

export const pickOne = <T>(items: T[], random: () => number): T => {
  return items[Math.floor(random() * items.length)]
}

export const shuffleDeterministic = <T>(items: T[], seed: number): T[] => {
  const output = [...items]
  const random = mulberry32(seed)
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[output[i], output[j]] = [output[j], output[i]]
  }
  return output
}

export const uniqueBy = <T>(items: T[], keySelector: (item: T) => string): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keySelector(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
