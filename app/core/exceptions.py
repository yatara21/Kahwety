from typing import Any, Optional


class AppException(Exception):
    def __init__(
        self,
        message: str,
        code: str = "APP_ERROR",
        details: Optional[list[Any]] = None,
        status_code: int = 500,
    ):
        self.message = message
        self.code = code
        self.details = details or []
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", details: Optional[list[Any]] = None):
        super().__init__(message, code="NOT_FOUND", details=details, status_code=404)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized", details: Optional[list[Any]] = None):
        super().__init__(message, code="UNAUTHORIZED", details=details, status_code=401)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden", details: Optional[list[Any]] = None):
        super().__init__(message, code="FORBIDDEN", details=details, status_code=403)


class ValidationException(AppException):
    def __init__(self, message: str = "Validation failed", details: Optional[list[Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", details=details, status_code=422)


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", details: Optional[list[Any]] = None):
        super().__init__(message, code="CONFLICT", details=details, status_code=409)


class BusinessException(AppException):
    def __init__(self, message: str = "Business rule violation", details: Optional[list[Any]] = None):
        super().__init__(message, code="BUSINESS_ERROR", details=details, status_code=400)


class InvalidGoogleTokenException(UnauthorizedException):
    def __init__(self, message: str = "Invalid Google token", details: Optional[list[Any]] = None):
        AppException.__init__(self, message, code="INVALID_GOOGLE_TOKEN", details=details, status_code=401)


class PhoneVerificationFailedException(BusinessException):
    def __init__(self, message: str = "Phone verification failed", details: Optional[list[Any]] = None):
        AppException.__init__(self, message, code="PHONE_VERIFICATION_FAILED", details=details, status_code=400)


class OtpSendFailedException(BusinessException):
    def __init__(self, message: str = "Failed to send OTP", details: Optional[list[Any]] = None):
        AppException.__init__(self, message, code="OTP_SEND_FAILED", details=details, status_code=400)


class OtpVerificationFailedException(UnauthorizedException):
    def __init__(self, message: str = "Invalid or expired OTP code", details: Optional[list[Any]] = None):
        AppException.__init__(self, message, code="OTP_VERIFICATION_FAILED", details=details, status_code=401)


class UserAlreadyExistsException(ConflictException):
    def __init__(self, message: str = "User already exists", details: Optional[list[Any]] = None):
        AppException.__init__(self, message, code="USER_ALREADY_EXISTS", details=details, status_code=409)


class RateLimitException(AppException):
    def __init__(self, retry_after_seconds: int):
        super().__init__(
            "Too many requests. Please try again later.",
            code="RATE_LIMITED",
            details=[{"retry_after_seconds": retry_after_seconds}],
            status_code=429,
        )
