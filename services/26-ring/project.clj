(defproject 26-ring "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [ring/ring-core "1.12"]
                 [ring/ring-jetty-adapter "1.12"]
                 [ring/ring-json "0.5.1"]
                 [compojure "1.7.1"]
                 [cheshire "5.13.0"]
                 ;; JWT: sign and verify HS256 tokens
                 [buddy/buddy-sign "3.6.1"]
                 [buddy/buddy-hashers "2.0.0"]
                 ;; DB: async PostgreSQL via next.jdbc + HoneySQL
                 [com.github.seancorfield/next.jdbc "1.3.939"]
                 [com.github.seancorfield/honeysql "2.6.1157"]
                 [org.postgresql/postgresql "42.7.3"]]
  :main ^:skip-aot 26_ring.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
