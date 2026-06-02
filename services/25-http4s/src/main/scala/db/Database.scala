package db

import cats.effect.{IO, Resource}
import doobie.hikari.HikariTransactor
import doobie.util.ExecutionContexts

object Database {
  // Transactor: connection pool manager for Doobie queries.
  def transactor(dbUrl: String): Resource[IO, HikariTransactor[IO]] =
    for {
      ce <- ExecutionContexts.fixedThreadPool[IO](32)
      xa <- HikariTransactor.newHikariTransactor[IO](
        driverClassName = "org.postgresql.Driver",
        url = dbUrl.replace("postgresql://", "jdbc:postgresql://")
          .replace("postgres://", "jdbc:postgresql://"),
        user = sys.env.getOrElse("DB_USER", "app"),
        pass = sys.env.getOrElse("DB_PASSWORD", "devpassword"),
        connectEC = ce
      )
    } yield xa
}
