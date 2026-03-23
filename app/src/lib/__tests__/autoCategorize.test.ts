import { describe, it, expect } from 'vitest';
import { autoCategorize } from '../autoCategorize';

describe('autoCategorize', () => {
  it('returns null for empty description', () => {
    expect(autoCategorize('')).toBeNull();
    expect(autoCategorize('   ')).toBeNull();
  });

  it('returns null for unknown business', () => {
    expect(autoCategorize('random unknown place')).toBeNull();
  });

  it('matches Israeli supermarkets to groceries', () => {
    expect(autoCategorize('שופרסל דיל נתניה')).toBe('groceries');
    expect(autoCategorize('רמי לוי שיווק השקמה')).toBe('groceries');
    expect(autoCategorize('חינם פלוס נתניה-צמרת')).toBe('groceries');
    expect(autoCategorize('טיב טעם')).toBe('groceries');
    expect(autoCategorize('ויקטורי')).toBe('groceries');
  });

  it('matches restaurants to food', () => {
    expect(autoCategorize('ארומה תל אביב')).toBe('food');
    expect(autoCategorize('מקדונלדס')).toBe('food');
    expect(autoCategorize('דני בתי מאפה')).toBe('food');
  });

  it('matches gas stations to transport', () => {
    expect(autoCategorize('פז גז נתניה')).toBe('transport');
    expect(autoCategorize('דלק הצפון')).toBe('transport');
    expect(autoCategorize('סונול')).toBe('transport');
  });

  it('matches pharmacies to health', () => {
    expect(autoCategorize('סופר-פארם')).toBe('health');
    expect(autoCategorize('סופר פארם נתניה')).toBe('health');
  });

  it('matches stores to shopping', () => {
    expect(autoCategorize('איקאה נתניה-גמא')).toBe('shopping');
    expect(autoCategorize('ZARA')).toBe('shopping');
    expect(autoCategorize('fox')).toBe('shopping');
  });

  it('matches utilities to bills', () => {
    expect(autoCategorize('חשמל ישראל')).toBe('bills');
    expect(autoCategorize('ליברה ביטוח חובה')).toBe('bills');
    expect(autoCategorize('פרטנר')).toBe('bills');
  });

  it('matches streaming to entertainment', () => {
    expect(autoCategorize('netflix')).toBe('entertainment');
    expect(autoCategorize('BABYLON PARK ISRAEL')).toBe('entertainment');
    expect(autoCategorize('spotify')).toBe('entertainment');
  });

  it('is case insensitive', () => {
    expect(autoCategorize('NETFLIX')).toBe('entertainment');
    expect(autoCategorize('Netflix')).toBe('entertainment');
    expect(autoCategorize('IKEA')).toBe('shopping');
  });
});
