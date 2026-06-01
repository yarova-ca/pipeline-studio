(defproject 26-pedestal "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [io.pedestal/pedestal.service "0.7"]
                 [io.pedestal/pedestal.jetty "0.7"]
                 [ch.qos.logback/logback-classic "1.5.12"]
                 [cheshire "5.13.0"]
                 ;; JWT: sign and verify HS256 tokens
                 [buddy/buddy-sign "3.6.1"]
                 [buddy/buddy-hashers "2.0.0"]
                 ;; DB: async PostgreSQL via next.jdbc
                 [com.github.seancorfield/next.jdbc "1.3.939"]
                 [org.postgresql/postgresql "42.7.3"]]
  :main ^:skip-aot 26_pedestal.service
  :profiles {:uberjar {:aot :all}})
