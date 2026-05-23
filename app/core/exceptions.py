from fastapi import HTTPException
from starlette.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

class CustomException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class TKGMError(Exception):
    def __init__(self, message: str = "TKGM service error"):
        self.message = message

class KEOSDiscoveryError(Exception):
    def __init__(self, message: str = "KEOS discovery error"):
        self.message = message

class TUCBSConnectionError(Exception):
    def __init__(self, message: str = "TUCBS connection error"):
        self.message = message

class EPlanError(Exception):
    def __init__(self, message: str = "E-Plan service error"):
        self.message = message

class CoordinateTransformError(Exception):
    def __init__(self, message: str = "Coordinate transformation error"):
        self.message = message

class ReportGenerationError(Exception):
    def __init__(self, message: str = "Report generation error"):
        self.message = message

async def custom_exception_handler(request, exc):
    if isinstance(exc, CustomException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    elif isinstance(exc, (TKGMError, KEOSDiscoveryError, TUCBSConnectionError,
                         EPlanError, CoordinateTransformError, ReportGenerationError)):
        return JSONResponse(
            status_code=502,
            content={"detail": str(exc.message), "error_type": exc.__class__.__name__}
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