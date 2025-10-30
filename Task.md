Task: Lets integrate memory threads api into our codebase.
Steps:
1. Checking existing codebase all the api in a separate folder named endpoints
2. Create a new files and write api logic there
3. Now connect that api with client file
4. Export types from index file
5. Write tests for the new api
6. Run all tests to make sure nothing is broken
7. Update check.ts file to include the new api


Here is the api: Forget Memories
curl -X 'POST' \
  'http://127.0.0.1:8000/v1/store/memories/forget' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "config": {},
  "options": {},
  "memory_type": "episodic",
  "category": "string",
  "filters": {}
}'

Response:
{
  "data": {
    "success": true,
    "data": {}
  },
  "metadata": {
    "message": "Success",
    "request_id": "50009c49f05241938ce738a2199cd38a",
    "timestamp": "2025-10-26T12:51:13.040424"
  }
}