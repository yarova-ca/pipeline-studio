name := "25-play"
version := "1.0.0"
scalaVersion := "3.4.2"

lazy val root = (project in file("."))
  .enablePlugins(PlayScala)
  .settings(
    libraryDependencies ++= Seq(
      guice,
      // JWT: sign and verify tokens using HS256
      "com.auth0"             % "java-jwt"               % "4.4.0",
      // Password hashing
      "org.mindrot"           % "jbcrypt"                % "0.4",
      // Slick ORM + PostgreSQL driver
      "com.typesafe.play"    %% "play-slick"             % "6.1.0",
      "com.typesafe.play"    %% "play-slick-evolutions"  % "6.1.0",
      "org.postgresql"        % "postgresql"             % "42.7.3",
      "org.scalatestplus.play" %% "scalatestplus-play"   % "7.0.1" % Test
    )
  )
