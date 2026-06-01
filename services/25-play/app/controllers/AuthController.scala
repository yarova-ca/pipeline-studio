package controllers

import models.{LoginRequest, RegisterRequest, UserPublic}
import services.JwtService
import play.api.libs.json._
import play.api.mvc._
import javax.inject._
import scala.concurrent.{ExecutionContext, Future}
import org.mindrot.jbcrypt.BCrypt

// AuthController handles POST /auth/register and POST /auth/login.
// Passwords are bcrypt-hashed before storage.
@Singleton
class AuthController @Inject()(
  val controllerComponents: ControllerComponents,
  jwtService: JwtService,
)(implicit ec: ExecutionContext) extends BaseController {

  // In-memory user store — replace with Slick + PostgreSQL for production.
  private var users: Map[Long, (String, String, String)] = Map.empty
  private var nextId: Long = 1L

  def register: Action[JsValue] = Action(parse.json) { request =>
    request.body.validate[RegisterRequest] match {
      case JsSuccess(body, _) =>
        val hash = BCrypt.hashpw(body.password, BCrypt.gensalt())
        val id = nextId
        nextId += 1
        users = users + (id -> (body.email, body.name, hash))
        val token = jwtService.sign(id.toString, body.email, body.name)
        Ok(Json.obj("token" -> token))
      case JsError(errors) =>
        BadRequest(Json.obj("errors" -> JsError.toJson(errors)))
    }
  }

  def login: Action[JsValue] = Action(parse.json) { request =>
    request.body.validate[LoginRequest] match {
      case JsSuccess(body, _) =>
        users.collectFirst { case (id, (email, name, hash)) if email == body.email => (id, name, hash) } match {
          case Some((id, name, hash)) if BCrypt.checkpw(body.password, hash) =>
            val token = jwtService.sign(id.toString, body.email, name)
            Ok(Json.obj("token" -> token))
          case _ => Unauthorized(Json.obj("error" -> "Invalid credentials"))
        }
      case JsError(errors) =>
        BadRequest(Json.obj("errors" -> JsError.toJson(errors)))
    }
  }
}
