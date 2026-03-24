Run a security check on the Shnekel app.

1. Run `npm audit` in the app directory and report findings by severity
2. Run the security tests: `cd app && npm test -- --run src/lib/__tests__/security.test.ts`
3. Verify Supabase RLS is active:
   ```bash
   ACCESS_TOKEN=$(echo "c2JwXzBjN2RhZGM2YWEyY2Q3ODc5ODFkMjcxYTFlMjU4NTdmZDU2OWY1ZTE=" | base64 -d)
   curl -s -X POST "https://api.supabase.com/v1/projects/eaqykxnysrtomvtyqpbg/database/query" \
     -H "Authorization: Bearer $ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = '\''public'\''"}'
   ```
4. Test unauthenticated API access (should return empty):
   ```bash
   ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcXlreG55c3J0b212dHlxcGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzM2MDQsImV4cCI6MjA4OTc0OTYwNH0.m0xHCh-f3NghmeLbftbKNxVyQ7UgsKQXJoTllwLtEUQ"
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
