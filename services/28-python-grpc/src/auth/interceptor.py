"""gRPC auth interceptor — validates JWT or API key from gRPC metadata.

gRPC metadata is the equivalent of HTTP headers.
Clients send: metadata = [('authorization', 'Bearer <token>')]
              metadata = [('x-api-key', '<key>')]

On valid JWT: calls servicer_context.proceed(), user is available in context.
On valid API key: DB lookup, proceeds with user attached.
On missing or invalid credential: aborts with StatusCode.UNAUTHENTICATED.
"""

import grpc
from sqlalchemy.future import select
from sqlalchemy.orm import Session

from src.auth.jwt import verify_token
from src.db.models import User
from src.db.session import AsyncSessionLocal


class AuthInterceptor(grpc.aio.ServerInterceptor):
    """gRPC async server interceptor that enforces JWT or API key auth."""

    async def intercept_service_async(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)

        # --- Attempt 1: Bearer JWT ---
        auth_header = metadata.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            payload = verify_token(token)
            if payload is not None:
                return await continuation(handler_call_details)
            return _unauthenticated_handler("Invalid or expired JWT token")

        # --- Attempt 2: X-API-Key ---
        api_key = metadata.get("x-api-key")
        if api_key:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(User).where(User.api_key == api_key)
                )
                user = result.scalars().first()
            if user is not None:
                return await continuation(handler_call_details)
            return _unauthenticated_handler("Invalid API key")

        return _unauthenticated_handler(
            "Authentication required. Provide Bearer token or x-api-key metadata."
        )


def _unauthenticated_handler(message: str):
    """Returns a gRPC handler that immediately aborts with UNAUTHENTICATED."""

    async def handler(request, context):
        await context.abort(grpc.StatusCode.UNAUTHENTICATED, message)

    return grpc.unary_unary_rpc_method_handler(handler)
