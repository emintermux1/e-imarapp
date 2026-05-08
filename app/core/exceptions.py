from fastapi import HTTPException
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

class CustomException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

async def custom_exception_handler(request, exc):
    if isinstance(exc, CustomException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    elif isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )