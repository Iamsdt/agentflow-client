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
curl -X 'GET' \
  'http://127.0.0.1:8000/v1/threads/5/messages/39dff7f2-b300-465a-82a3-3985b7c8bc81' \
  -H 'accept: application/json'


Response:
{
  "data": {
    "message_id": "39dff7f2-b300-465a-82a3-3985b7c8bc81",
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "HI",
        "annotations": []
      }
    ],
    "delta": false,
    "tools_calls": null,
    "reasoning": null,
    "timestamp": 1761301570.507072,
    "metadata": {},
    "usages": null,
    "raw": null
  },
  "metadata": {
    "request_id": "3dd8d66c-e9eb-4a2f-ac43-4548dab7b510",
    "timestamp": "2025-10-24T16:34:26.333220",
    "message": "OK"
  }
}

Here data is the message object.