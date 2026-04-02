from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "status": "error",
            "message": None,
            "errors": response.data,
        }

        if isinstance(response.data, list):
            error_data["message"] = response.data[0] if response.data else "An error occurred"
        elif isinstance(response.data, dict):
            first_key = next(iter(response.data), None)
            if first_key:
                error_data["message"] = f"{first_key}: {response.data[first_key]}"
            else:
                error_data["message"] = "An error occurred"
        else:
            error_data["message"] = str(response.data)

        response.data = error_data

    return response
