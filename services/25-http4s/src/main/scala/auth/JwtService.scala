package auth

import cats.effect.IO
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import java.util.Date
import scala.util.Try

// JwtService — signs and verifies JWTs using HS256.
// Secret loaded from JWT_SECRET env var; falls back to "dev-secret".
object JwtService {
  private val secret: String  = sys.env.getOrElse("JWT_SECRET", "dev-secret")
  private val algorithm       = Algorithm.HMAC256(secret)
  // Token valid for 8 hours (28800 seconds).
  private val expiryMs: Long  = 8L * 3600 * 1000

  def sign(userId: String, email: String, name: String): IO[String] = IO {
    JWT.create()
      .withClaim("id", userId)
      .withClaim("email", email)
      .withClaim("name", name)
      .withExpiresAt(new Date(System.currentTimeMillis() + expiryMs))
      .sign(algorithm)
  }

  def verify(token: String): IO[Map[String, String]] = IO.fromTry(Try {
    val decoded = JWT.require(algorithm).build().verify(token)
    Map(
      "id"    -> decoded.getClaim("id").asString(),
      "email" -> decoded.getClaim("email").asString(),
      "name"  -> decoded.getClaim("name").asString(),
    )
  })
}
