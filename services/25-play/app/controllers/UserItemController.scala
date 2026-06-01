package controllers

import models.Item
import services.JwtService
import play.api.libs.json._
import play.api.mvc._
import javax.inject._
import scala.util.Success

// UserItemController — JWT-protected CRUD for Items.
// All actions require a valid Bearer token in Authorization header.
@Singleton
class UserItemController @Inject()(
  val controllerComponents: ControllerComponents,
  jwtService: JwtService,
) extends BaseController {

  // In-memory item store — replace with Slick + PostgreSQL for production.
  private var items: Map[Long, Item] = Map.empty
  private var nextId: Long = 1L

  private def authenticated(request: Request[?]): Option[Map[String, String]] =
    request.headers.get("Authorization")
      .collect { case h if h.startsWith("Bearer ") => h.drop(7) }
      .flatMap(token => jwtService.verify(token).toOption)

  // GET /items — list items owned by the authenticated user.
  def list: Action[AnyContent] = Action { request =>
    authenticated(request) match {
      case None => Unauthorized(Json.obj("error" -> "Unauthorized"))
      case Some(claims) =>
        val userId = claims("id").toLong
        val userItems = items.values.filter(_.userId == userId).toSeq
        Ok(Json.toJson(userItems))
    }
  }

  // POST /items — create an item for the authenticated user.
  def create: Action[JsValue] = Action(parse.json) { request =>
    authenticated(request) match {
      case None => Unauthorized(Json.obj("error" -> "Unauthorized"))
      case Some(claims) =>
        val userId = claims("id").toLong
        (request.body \ "title").asOpt[String] match {
          case None => BadRequest(Json.obj("error" -> "missing title"))
          case Some(title) =>
            val id = nextId; nextId += 1
            val item = Item(id = id, title = title, userId = userId)
            items = items + (id -> item)
            Created(Json.toJson(item))
        }
    }
  }

  // DELETE /items/:id — delete an item owned by the authenticated user.
  def delete(id: Long): Action[AnyContent] = Action { request =>
    authenticated(request) match {
      case None => Unauthorized(Json.obj("error" -> "Unauthorized"))
      case Some(claims) =>
        val userId = claims("id").toLong
        items.get(id).filter(_.userId == userId) match {
          case None    => NotFound(Json.obj("error" -> "Not found"))
          case Some(_) => items = items - id; NoContent
        }
    }
  }
}
