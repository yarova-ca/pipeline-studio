package models

import io.circe.generic.auto._
import io.circe.{Encoder, Decoder}

// User — persisted via Doobie + PostgreSQL.
case class User(id: Long, email: String, name: String, passwordHash: String)

// UserPublic — safe subset of User returned in API responses.
case class UserPublic(id: Long, email: String, name: String)

// Item — owned by a User, persisted via Doobie + PostgreSQL.
case class Item(id: Long, title: String, userId: Long)

// Request bodies for auth endpoints.
case class RegisterRequest(email: String, name: String, password: String)
case class LoginRequest(email: String, password: String)
case class ItemRequest(title: String)
