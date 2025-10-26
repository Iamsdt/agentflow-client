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
  'http://127.0.0.1:8000/v1/store/memories' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "config": {},
  "options": {},
  "content": "string",
  "memory_type": "episodic",
  "category": "general",
  "metadata": {}
}'



class MemoryType(Enum):
    """Types of memories that can be stored."""

    EPISODIC = "episodic"  # Conversation memories
    SEMANTIC = "semantic"  # Facts and knowledge
    PROCEDURAL = "procedural"  # How-to knowledge
    ENTITY = "entity"  # Entity-based memories
    RELATIONSHIP = "relationship"  # Entity relationships
    CUSTOM = "custom"  # Custom memory types
    DECLARATIVE = "declarative"  # Explicit facts and events


Response:
{
  "data": {
    "memory_id": "string"
  },
  "metadata": {
    "message": "Success",
    "request_id": "e0c023e6066742b8bba8ad7990608018",
    "timestamp": "2025-10-26T12:05:32.986050"
  }
}
