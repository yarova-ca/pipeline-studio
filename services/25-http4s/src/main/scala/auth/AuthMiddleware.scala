package auth

import cats.data.{Kleisli, OptionT}
import cats.effect.IO
import org.http4s.{Request, Response, Status}
import org.http4s.headers.Authorization

// AuthMiddleware — wraps http4s routes with JWT Bearer token verification.
// Rejects requests missing or carrying an invalid token with 401.
object AuthMiddleware {
  type AuthedRequest = (Request[IO], Map[String, String])

  def apply(
    routes: Kleisli[OptionT[IO, *], AuthedRequest, Response[IO]]
  ): Kleisli[IO, Request[IO], Response[IO]] =
    Kleisli { req =>
      val token: Option[String] = req.headers
        .get[Authorization]
        .map(_.credentials.toString)
        .collect { case h if h.startsWith("Bearer ") => h.drop(7) }

      token match {
        case None =>
          IO.pure(Response[IO](Status.Unauthorized))
        case Some(t) =>
          JwtService.verify(t).flatMap { claims =>
            routes
              .run((req, claims))
              .getOrElse(Response[IO](Status.NotFound))
          }.handleError(_ => Response[IO](Status.Unauthorized))
      }
    }
}
