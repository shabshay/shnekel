Run a full QA pass on the app using the preview server.

1. Start the dev server using `preview_start`
2. Set up test data (auth session, settings with monthly budget, sample expenses across multiple days/categories)
3. Test each screen systematically:
   - Login page renders
   - Dashboard: logo, gauge, category bars, period nav, search, expense list with date groups
   - Settings overlay: all controls work, dark mode toggle, reset data, sign out
   - Add expense: amount, category, description, notes & receipt section
   - Edit expense: tap existing → modal pre-filled → save changes → verify
   - Delete expense: confirm dialog shows → cancel preserves → delete removes
   - Reports: stats cards, chart, export button
   - Recurring: add/edit/toggle/delete
   - Import: upload zone, template download
   - Categories: default list, add custom, verify in pickers
4. Check console for errors (ignore fake auth token errors in QA)
5. Test dark mode rendering
6. Report results in a table format
