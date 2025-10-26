Task: Lets integrate memory threads api into our codebase.
Steps:
1. Checking existing codebase all the api in a separate folder named endpoints
2. Create a new files and write api logic there
3. Now connect that api with client file
4. Export types from index file
5. Write tests for the new api
6. Run all tests to make sure nothing is broken
7. Update check.ts file to include the new api


Here is the api:
curl -X 'POST' \
  'http://127.0.0.1:8000/v1/store/memories/56565' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "config": {},
  "options": {}
}'


Response:
{
  "data": {
    "memory": {
      "id": "string",
      "content": "",
      "score": 0,
      "memory_type": "episodic",
      "metadata": {},
      "vector": [
        0
      ],
      "user_id": "string",
      "thread_id": "string",
      "timestamp": "2025-10-26T07:05:48.277Z"
    }
  },
  "metadata": {
    "message": "Success",
    "request_id": "e0c023e6066742b8bba8ad7990608018",
    "timestamp": "2025-10-26T12:05:32.986050"
  }
}