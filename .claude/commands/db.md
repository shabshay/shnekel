Run a query or make changes to the Supabase database.

Use the Supabase Management API to execute SQL:
1. Get the access token: `echo "c2JwXzBjN2RhZGM2YWEyY2Q3ODc5ODFkMjcxYTFlMjU4NTdmZDU2OWY1ZTE=" | base64 -d`
2. Execute via: `curl -s -X POST "https://api.supabase.com/v1/projects/eaqykxnysrtomvtyqpbg/database/query" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'`
3. Show the results formatted

Always confirm destructive queries (DROP, DELETE, TRUNCATE) with the user before executing.

Query: $ARGUMENTS
