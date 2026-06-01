import cats.effect._
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.circe.CirceEntityEncoder._
import io.circe.generic.auto._
import com.comcast.ip4s._

case class Hello(message: String, framework: String, version: String)
case class Health(status: String, version: Option[String] = None)

object Main extends IOApp {

  val routes: HttpRoutes[IO] = HttpRoutes.of {
    case GET -> Root =>
      Ok(Hello("Hello from http4s 0.23", "25-http4s", "1.0.0"))
    case GET -> Root / "health" =>
      Ok(Health("ok", Some("1.0.0")))
    case GET -> Root / "health" / "live" =>
      Ok(Health("ok"))
    case GET -> Root / "health" / "ready" =>
      Ok(Health("ok"))
  }

  def run(args: List[String]): IO[ExitCode] =
    EmberServerBuilder.default[IO]
      .withHost(ipv4"0.0.0.0")
      .withPort(port"8080")
      .withHttpApp(routes.orNotFound)
      .build
      .use(_ => IO.println("http4s running on port 8080") >> IO.never)
      .as(ExitCode.Success)
}
