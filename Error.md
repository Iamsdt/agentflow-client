400 Error
{
  "metadata": {
    "message": "Failed",
    "request_id": "9843ae2e8f054fc7b6fcadf743483a08",
    "timestamp": "2025-10-26T12:05:32.987017"
  },
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input, please check the input data for any errors",
    "details": []
  }
}


401 Unauthorized
{
  "metadata": {
    "message": "Failed",
    "request_id": "318a899eaf5f436d9c486788249da8c3",
    "timestamp": "2025-10-26T12:05:32.988358"
  },
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Please provide valid credentials",
    "details": []
  }
}


403 Forbidden
{
  "metadata": {
    "message": "Failed",
    "request_id": "c1a94ea70c43421ca07ed3e4f3af7fd2",
    "timestamp": "2025-10-26T12:05:32.988994"
  },
  "error": {
    "code": "PERMISSION_ERROR",
    "message": "You don't have permission to access this resource",
    "details": []
  }
}


404 Not Found
{
  "metadata": {
    "message": "Failed",
    "request_id": "2878f2229c3246649e60aa574a71a90e",
    "timestamp": "2025-10-26T12:05:32.987705"
  },
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "details": []
  }
}

422 Validation Error
{
  "metadata": {
    "message": "Failed",
    "request_id": "6b08dd969bc44f4c8e9735ee14d9de0e",
    "timestamp": "2025-10-26T12:05:32.989646"
  },
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "loc": [
          "body",
          "name"
        ],
        "msg": "field required",
        "type": "value_error.missing"
      }
    ]
  }
}