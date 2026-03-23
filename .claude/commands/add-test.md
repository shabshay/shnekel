Add unit tests for existing untested code.

1. Identify functions/modules that lack test coverage by examining `src/lib/__tests__/` and `src/hooks/__tests__/`
2. If $ARGUMENTS specifies a file or function, focus on that. Otherwise, find the most impactful untested code.
3. Write tests following project patterns:
   - Import from vitest: `describe, it, expect, vi, beforeEach`
   - Mock `sync.ts` for storage tests
   - Mock `localStorage` with Map-based implementation
   - Test edge cases: empty data, negative numbers, missing fields, boundary conditions
4. Run `npm test` — all tests must pass
5. Report what was tested and the new test count

Target: $ARGUMENTS
