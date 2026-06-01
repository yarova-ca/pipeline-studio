import GRPC
import NIOCore

// gRPC server interceptor — validates JWT on every inbound call.
// Interceptor: middleware that runs before the actual gRPC handler.
//
// When Authorization metadata is present and valid: call proceeds.
// When missing or invalid: call fails with UNAUTHENTICATED status code.
// Health check calls are exempt — liveness/readiness probes must not require auth.

final class AuthServerInterceptor<Request, Response>: ServerInterceptor<Request, Response> {
    private static var exempt: Set<String> {
        ["/grpc.health.v1.Health/Check", "/grpc.health.v1.Health/Watch"]
    }

    override func receive(
        _ part: GRPCServerRequestPart<Request>,
        context: ServerInterceptorContext<Request, Response>
    ) {
        guard case .metadata(let headers) = part else {
            context.receive(part)
            return
        }

        // Exempt health check paths from auth.
        if Self.exempt.contains(context.path) {
            context.receive(part)
            return
        }

        guard let authValue = headers.first(name: "authorization"),
              authValue.hasPrefix("Bearer ") else {
            context.sendErrorStatus(.init(
                code: .unauthenticated,
                message: "Missing or malformed Authorization header"
            ))
            return
        }

        let token = String(authValue.dropFirst(7))
        do {
            let claims = try JWTService.verify(token)
            // Store user in context userInfo for downstream handlers.
            var mutableHeaders = headers
            mutableHeaders.replaceOrAdd(name: "x-user-id", value: claims.id)
            mutableHeaders.replaceOrAdd(name: "x-user-email", value: claims.email)
            context.receive(.metadata(mutableHeaders))
        } catch {
            context.sendErrorStatus(.init(
                code: .unauthenticated,
                message: "Invalid or expired token"
            ))
        }
    }
}

// Factory that produces an AuthServerInterceptor for every call on a service.
struct AuthInterceptorFactory<Request, Response>: ServerInterceptorFactory {
    func makeInterceptors() -> [ServerInterceptor<Request, Response>] {
        [AuthServerInterceptor()]
    }
}
