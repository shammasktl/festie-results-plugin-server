#!/bin/bash

# Test script for program results publish endpoint
echo "=== Testing Program Results Publish Endpoint ==="
echo

# Test 1: Check if endpoint exists (should return 401 without auth)
echo "1. Testing endpoint accessibility (should return 401):"
curl -X POST http://localhost:5000/api/event/test/programs/test/publish \
  -H "Content-Type: application/json" \
  -w "\nStatus Code: %{http_code}\n\n"

# Test 2: Test with invalid token (should return 403)
echo "2. Testing with invalid token (should return 403):"
curl -X POST http://localhost:5000/api/event/test/programs/test/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: token=invalid_token" \
  -w "\nStatus Code: %{http_code}\n\n"

# Test 3: Check route registration
echo "3. Available routes (from Express router):"
echo "The publish endpoint should be registered as:"
echo "POST /api/event/:eventId/programs/:programId/publish"
echo

# Test 4: Check server logs for any errors
echo "4. Check if server is running on port 5000:"
netstat -tlnp | grep :5000 || echo "Server not running on port 5000"
echo

echo "=== Troubleshooting Steps ==="
echo "1. Make sure you have a valid authentication token"
echo "2. Ensure the eventId and programId exist in your database"
echo "3. Make sure you've entered results first using the scores endpoint"
echo "4. Check the server logs for any errors"
echo
echo "Example of correct usage:"
echo "curl -X POST http://localhost:5000/api/event/YOUR_EVENT_ID/programs/YOUR_PROGRAM_ID/publish \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Cookie: token=YOUR_VALID_TOKEN'"
echo

echo "=== Common Issues ==="
echo "- 401 Unauthorized: Missing or invalid authentication token"
echo "- 403 Forbidden: Token expired or insufficient permissions"
echo "- 404 Not Found: Event or program doesn't exist"
echo "- 400 Bad Request: No results to publish (enter scores first)"
echo "- 500 Internal Server Error: Server-side issue (check logs)"