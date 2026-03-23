import type { Category } from '../types'

// Business name fragments → category key
// Keys are lowercase. Matching is substring-based.
const BUSINESS_MAP: [string, Category][] = [
  // Groceries / Supermarkets
  ['שופרסל', 'groceries'],
  ['רמי לוי', 'groceries'],
  ['מגה ', 'groceries'],
  ['יוחננוף', 'groceries'],
  ['ויקטורי', 'groceries'],
  ['חצי חינם', 'groceries'],
  ['חינם פלוס', 'groceries'],
  ['אושר עד', 'groceries'],
  ['טיב טעם', 'groceries'],
  ['סופר יודה', 'groceries'],
  ['am:pm', 'groceries'],
  // NOTE: generic 'סופר' is at the very end as a fallback

  // Food / Restaurants
  ['מקדונלד', 'food'],
  ['ארומה', 'food'],
  ['רולדין', 'food'],
  ['בורגר', 'food'],
  ['פיצה', 'food'],
  ['בוסליקה', 'food'],
  ['שווארמה', 'food'],
  ['פלאפל', 'food'],
  ['קפה', 'food'],
  ['cafe', 'food'],
  ['restaurant', 'food'],
  ['מאפה', 'food'],
  ['סושי', 'food'],
  ['wolt', 'food'],
  ['japanika', 'food'],

  // Transport
  ['פז ', 'transport'],
  ['דלק', 'transport'],
  ['סונול', 'transport'],
  ['דור אלון', 'transport'],
  ['ten ', 'transport'],
  ['yellow', 'transport'],
  ['רכבת', 'transport'],
  ['אגד', 'transport'],
  ['דן ', 'transport'],
  ['מוניות', 'transport'],
  ['gett', 'transport'],
  ['bolt', 'transport'],
  ['מוסכ', 'transport'],
  ['חניה', 'transport'],
  ['parking', 'transport'],

  // Health
  ['סופר-פארם', 'health'],
  ['סופר פארם', 'health'],
  ['בי יור', 'health'],
  ['be ', 'health'],
  ['מכבי', 'health'],
  ['כללית', 'health'],
  ['לאומית', 'health'],
  ['מאוחדת', 'health'],
  ['רפואה', 'health'],
  ['פארם', 'health'],
  ['pharmacy', 'health'],

  // Shopping
  ['זארה', 'shopping'],
  ['zara', 'shopping'],
  ['fox', 'shopping'],
  ['h&m', 'shopping'],
  ['עזריאלי', 'shopping'],
  ['קניון', 'shopping'],
  ['איקאה', 'shopping'],
  ['ikea', 'shopping'],
  ['ביג ', 'shopping'],
  ['נעלי', 'shopping'],
  ['אמזון', 'shopping'],
  ['amazon', 'shopping'],
  ['aliexpress', 'shopping'],
  ['shein', 'shopping'],

  // Bills & Utilities
  ['חשמל', 'bills'],
  ['בזק', 'bills'],
  ['פרטנר', 'bills'],
  ['סלקום', 'bills'],
  ['הוט', 'bills'],
  ['yes ', 'bills'],
  ['עירייה', 'bills'],
  ['ביטוח', 'bills'],
  ['insurance', 'bills'],
  ['מים ', 'bills'],
  ['ארנונה', 'bills'],

  // Entertainment
  ['סינמה', 'entertainment'],
  ['yes planet', 'entertainment'],
  ['סינמטק', 'entertainment'],
  ['באבילון', 'entertainment'],
  ['babylon', 'entertainment'],
  ['netflix', 'entertainment'],
  ['spotify', 'entertainment'],
  ['disney', 'entertainment'],
  ['apple tv', 'entertainment'],

  // Generic fallback — keep last so specific matches (סופר-פארם → health) win
  ['סופר', 'groceries'],
]

/**
 * Auto-detect category from a business name / expense description.
 * Returns the matched category or null if no match found.
 * Matching is case-insensitive and substring-based.
 */
export function autoCategorize(description: string): Category | null {
  if (!description) return null
  const lower = description.toLowerCase()

  for (const [fragment, category] of BUSINESS_MAP) {
    if (lower.includes(fragment.toLowerCase())) {
      return category
    }
  }

  return null
}
