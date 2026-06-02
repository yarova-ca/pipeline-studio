package models

import doobie._
import doobie.implicits._
import cats.effect.IO

case class User(id: String, email: String, name: String, apiKey: Option[String], provider: String)
case class Item(id: String, title: String, description: Option[String], userId: String)

object UserQueries {
  def findByApiKey(apiKey: String): Query0[User] =
    sql"SELECT id, email, name, api_key, provider FROM users WHERE api_key = $apiKey".query[User]
}
