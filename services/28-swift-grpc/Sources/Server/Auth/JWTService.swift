import Foundation
import Crypto

// JWT (JSON Web Token) — a signed token carrying user identity claims.
// This file implements HS256 JWT signing and verification without an external package.
// Why no library: swift-grpc services run on Linux — JWTKit requires Vapor which
// adds significant overhead for a pure gRPC service.

struct JWTClaims: Codable {
    let id: String
    let email: String
    let name: String
    let exp: TimeInterval   // Unix timestamp — seconds since epoch

    var isExpired: Bool { Date().timeIntervalSince1970 > exp }
}

enum JWTError: Error {
    case invalid
    case expired
    case missingSecret
}

struct JWTService {
    static var secret: String {
        ProcessInfo.processInfo.environment["JWT_SECRET"] ?? "dev-secret-change-in-production"
    }

    // Sign a JWT for the given user. Expires in 8 hours.
    static func sign(id: String, email: String, name: String) throws -> String {
        let claims = JWTClaims(
            id: id,
            email: email,
            name: name,
            exp: Date().addingTimeInterval(8 * 3600).timeIntervalSince1970
        )
        let encoder = JSONEncoder()
        let header = try encoder.encode(["alg": "HS256", "typ": "JWT"])
        let payload = try encoder.encode(claims)

        let headerB64 = header.base64URLEncoded()
        let payloadB64 = payload.base64URLEncoded()
        let signingInput = "\(headerB64).\(payloadB64)"

        let key = SymmetricKey(data: Data(secret.utf8))
        let signature = HMAC<SHA256>.authenticationCode(
            for: Data(signingInput.utf8),
            using: key
        )
        let sigB64 = Data(signature).base64URLEncoded()
        return "\(signingInput).\(sigB64)"
    }

    // Verify a JWT. Returns claims on success, throws on invalid/expired.
    static func verify(_ token: String) throws -> JWTClaims {
        let parts = token.split(separator: ".", maxSplits: 2).map(String.init)
        guard parts.count == 3 else { throw JWTError.invalid }

        let signingInput = "\(parts[0]).\(parts[1])"
        let key = SymmetricKey(data: Data(secret.utf8))
        let expectedSig = HMAC<SHA256>.authenticationCode(
            for: Data(signingInput.utf8),
            using: key
        )
        let expectedB64 = Data(expectedSig).base64URLEncoded()
        guard expectedB64 == parts[2] else { throw JWTError.invalid }

        guard let payloadData = Data(base64URLEncoded: parts[1]) else { throw JWTError.invalid }
        let claims = try JSONDecoder().decode(JWTClaims.self, from: payloadData)
        if claims.isExpired { throw JWTError.expired }
        return claims
    }
}

private extension Data {
    func base64URLEncoded() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }

    init?(base64URLEncoded string: String) {
        var s = string
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while s.count % 4 != 0 { s += "=" }
        self.init(base64Encoded: s)
    }
}
