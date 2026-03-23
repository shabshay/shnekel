import { describe, it, expect } from 'vitest';

// The importParser has private functions. We test via the public API
// and also test the category mapping logic by importing the module.
// Since mapCategory, parseDate, parseAmount are private, we test them
// indirectly through parseImportFile or directly test the exported function.

// For now, test the downloadTemplate function exists and category mapping
// by creating a minimal normalized spreadsheet buffer.

import { parseImportFile, downloadTemplate } from '../importParser';

describe('parseImportFile', () => {
  it('returns error for empty/invalid file', async () => {
    const file = new File([new Uint8Array(0)], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const result = await parseImportFile(file);
    expect(result.format).toBe('unknown');
    expect(result.rows).toHaveLength(0);
    expect(result.error).toBeDefined();
  });

  it('parses a normalized CSV with standard headers', async () => {
    const csv = 'date,description,amount,category\n2025-01-15,Supermarket,150,food\n2025-01-16,Bus,50,transport\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.error).toBeUndefined();
    expect(result.format).toBe('normalized');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].description).toBe('Supermarket');
    expect(result.rows[0].amount).toBe(150);
    expect(result.rows[0].category).toBe('food');
    expect(result.rows[1].category).toBe('transport');
  });

  it('maps English category aliases', async () => {
    const csv = 'date,description,amount,category\n2025-01-15,Test,100,groceries\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].category).toBe('groceries');
  });

  it('maps unknown categories to other', async () => {
    const csv = 'date,description,amount,category\n2025-01-15,Test,100,xyz_unknown\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.rows[0].category).toBe('other');
  });

  it('skips rows with zero or negative amounts', async () => {
    const csv = 'date,description,amount\n2025-01-15,Good,100\n2025-01-15,Bad,0\n2025-01-15,Negative,-50\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].description).toBe('Good');
  });

  it('handles DD/MM/YYYY date format', async () => {
    const csv = 'date,description,amount\n15/06/2025,Test,100\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.rows).toHaveLength(1);
    const date = new Date(result.rows[0].date);
    expect(date.getDate()).toBe(15);
    expect(date.getMonth()).toBe(5); // June = 5
    expect(date.getFullYear()).toBe(2025);
  });

  it('handles large amounts', async () => {
    const csv = 'date,description,amount\n2025-01-15,Test,1250\n';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(1250);
  });
});

describe('downloadTemplate', () => {
  it('is a function', () => {
    expect(typeof downloadTemplate).toBe('function');
  });
});
