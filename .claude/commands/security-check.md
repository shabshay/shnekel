Run a security check on the Shnekel app.

1. Run `npm audit` in the app directory and report findings by severity
2. Run the security tests: `cd app && npm test -- --run src/lib/__tests__/security.test.ts`
3. Verify Supabase RLS is active:
   ```bash
   ACCESS_TOKEN=$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null | sed 's/go-keyring-base64://' | base64 -d)
   curl -s -X POST "https://api.supabase.com/v1/projects/eaqykxnysrtomvtyqpbg/database/query" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = '\''public'\''"}'
   ```
4. Test unauthenticated API access (should return empty). The anon key is public (embedded in client bundle):
   ```bash
   ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY app/.env | cut -d= -f2)
   curl -s "https://eaqykxnysrtomvtyqpbg.supabase.co/rest/v1/expenses?select=id&limit=5" \
     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"
   ```
5. Test storage bucket listing (should return empty):
   ```bash
   curl -s "https://eaqykxnysrtomvtyqpbg.supabase.co/storage/v1/object/list/receipts" \
     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" -d '{"prefix":"","limit":10}'
   ```
6. Report results in a table:

| Check | Status | Details |
|-------|--------|---------|
| npm audit (critical) | ✅/❌ | count |
| Security tests | ✅/❌ | pass/fail |
| RLS enabled (settings) | ✅/❌ | |
| RLS enabled (expenses) | ✅/❌ | |
| Unauth API blocked | ✅/❌ | |
| Bucket listing blocked | ✅/❌ | |
