(defproject 26-ring "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [ring/ring-core "1.12"]
                 [ring/ring-jetty-adapter "1.12"]
                 [compojure "1.7.1"]
                 [cheshire "5.13.0"]]
  :main ^:skip-aot 26_ring.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
