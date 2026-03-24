Run a query or make changes to the Supabase database.

Use the Supabase Management API to execute SQL:
1. Get the access token from macOS keychain: `security find-generic-password -s "Supabase CLI" -w 2>/dev/null | sed 's/go-keyring-base64://' | base64 -d`
2. Execute via: `curl -s -X POST "https://api.supabase.com/v1/projects/eaqykxnysrtomvtyqpbg/database/query" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'`
3. Show the results formatted

Always confirm destructive queries (DROP, DELETE, TRUNCATE) with the user before executing.

Query: $ARGUMENTS
