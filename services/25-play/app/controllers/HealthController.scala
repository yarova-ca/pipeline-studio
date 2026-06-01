package controllers

import play.api.mvc._
import play.api.libs.json._
import javax.inject._

@Singleton
class HealthController @Inject()(val controllerComponents: ControllerComponents) extends BaseController {

  def hello: Action[AnyContent] = Action {
    Ok(Json.obj("message" -> s"Hello from Play 3.0", "framework" -> "25-play", "version" -> "1.0.0"))
  }

  def health: Action[AnyContent] = Action {
    Ok(Json.obj("status" -> "ok", "version" -> "1.0.0"))
  }

  def liveness: Action[AnyContent] = Action { Ok(Json.obj("status" -> "ok")) }
  def readiness: Action[AnyContent] = Action { Ok(Json.obj("status" -> "ok")) }
}
