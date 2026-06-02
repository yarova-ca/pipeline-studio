package models

import slick.jdbc.PostgresProfile.api._
import scala.concurrent.{ExecutionContext, Future}

class Users(tag: Tag) extends Table[User](tag, "users") {
  def id           = column[Long]("id", O.PrimaryKey, O.AutoInc)
  def email        = column[String]("email")
  def name         = column[String]("name")
  def passwordHash = column[String]("password_hash")
  def * = (id, email, name, passwordHash).mapTo[User]
}

object Users {
  val query = TableQuery[Users]
}

class Items(tag: Tag) extends Table[Item](tag, "items") {
  def id     = column[Long]("id", O.PrimaryKey, O.AutoInc)
  def title  = column[String]("title")
  def userId = column[Long]("user_id")
  def * = (id, title, userId).mapTo[Item]

  def userFk = foreignKey("item_user_fk", userId, TableQuery[Users])(_.id)
}

object Items {
  val query = TableQuery[Items]
}
