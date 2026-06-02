name := "25-http4s"
version := "1.0.0"
scalaVersion := "3.4.2"

libraryDependencies ++= Seq(
  "org.http4s"    %% "http4s-ember-server"  % "0.23",
  "org.http4s"    %% "http4s-dsl"           % "0.23",
  "org.http4s"    %% "http4s-circe"         % "0.23",
  "io.circe"      %% "circe-generic"        % "0.14.10",
  "org.typelevel" %% "cats-effect"          % "3.5.7",
  // JWT: sign and verify tokens using HS256
  "com.auth0"      % "java-jwt"             % "4.4.0",
  // Doobie: async PostgreSQL ORM for Cats Effect
  "org.tpolecat"  %% "doobie-core"          % "1.0.0-RC6",
  "org.tpolecat"  %% "doobie-postgres"      % "1.0.0-RC6",
  "org.tpolecat"  %% "doobie-hikari"        % "1.0.0-RC6",
  // Password hashing
  "org.mindrot"    % "jbcrypt"              % "0.4",
  "org.scalameta" %% "munit"               % "1.0.3"   % Test,
  "org.typelevel" %% "munit-cats-effect"   % "2.0.0"   % Test,
)
