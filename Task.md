Task: Lets intrgeate Checkpoint apis
Steps:
1. Checking existing codebase all the api in a seperate folder named endpoints
2. Create a new files and write api logic there
3. Now connect that api with client file
4. Export types from index file
5. Write tests for the new api
6. Run all tests to make sure nothing is broken
7. Update check.ts file to include the new api


Here is the api:
curl -X 'DELETE' \
  'http://127.0.0.1:8000/v1/threads/5/state' \
  -H 'accept: application/json'


Response:
{
  "data": {
    "success": true,
    "message": "State cleared successfully",
    "data": true
  },
  "metadata": {
    "request_id": "07471cf8-0d95-4f4f-af23-619d1011a465",
    "timestamp": "2025-10-24T15:59:17.683517",
    "message": "OK"
  }
}