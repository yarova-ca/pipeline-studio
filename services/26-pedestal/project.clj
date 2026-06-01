(defproject 26-pedestal "1.0.0"
  :dependencies [[org.clojure/clojure "1.12.0"]
                 [io.pedestal/pedestal.service "0.7"]
                 [io.pedestal/pedestal.jetty "0.7"]
                 [ch.qos.logback/logback-classic "1.5.12"]
                 [cheshire "5.13.0"]]
  :main ^:skip-aot 26_pedestal.service
  :profiles {:uberjar {:aot :all}})
