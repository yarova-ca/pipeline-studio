package models

import play.api.libs.json.{Json, OFormat}

// User — mapped to the `users` table via Slick.
case class User(
  id: Long = 0L,
  email: String,
  name: String,
  passwordHash: String,
)

object User {
  // JSON format for API responses — excludes passwordHash.
  implicit val publicFormat: OFormat[UserPublic] = Json.format[UserPublic]
}

// UserPublic — safe subset of User returned in API responses.
case class UserPublic(id: Long, email: String, name: String)

// Item — owned by a User, mapped to the `items` table via Slick.
case class Item(
  id: Long = 0L,
  title: String,
  userId: Long,
)

object Item {
  implicit val format: OFormat[Item] = Json.format[Item]
}

// Request body for auth endpoints.
case class RegisterRequest(email: String, name: String, password: String)
case class LoginRequest(email: String, password: String)

object RegisterRequest { implicit val format: OFormat[RegisterRequest] = Json.format }
object LoginRequest    { implicit val format: OFormat[LoginRequest]    = Json.format }
