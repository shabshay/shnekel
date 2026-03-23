Investigate and fix a bug in Shnekel.

Follow this workflow:
1. **Reproduce** — Start the preview server and reproduce the bug visually
2. **Investigate** — Check console errors, trace the code path, identify root cause
3. **Fix** — Make the minimal change needed to fix the bug
4. **Test** — Add a test that would have caught this bug (if applicable)
5. **Verify** — Run `npm test` and `npm run build` — both must pass
6. **QA** — Visually confirm the fix in the preview and check for regressions
7. **Deploy** — Use /deploy to ship the fix

Bug description: $ARGUMENTS
