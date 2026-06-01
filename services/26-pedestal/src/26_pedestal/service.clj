(ns 26_pedestal.service
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [cheshire.core :as json])
  (:gen-class))

(defn json-response [body]
  {:status 200 :headers {"Content-Type" "application/json"} :body (json/generate-string body)})

(defn hello [_] (json-response {:message "Hello from Pedestal 0.7" :framework "26-pedestal" :version "1.0.0"}))
(defn health [_] (json-response {:status "ok" :version "1.0.0"}))
(defn liveness [_] (json-response {:status "ok"}))
(defn readiness [_] (json-response {:status "ok"}))

(def routes
  (route/expand-routes
    #{["/" :get hello :route-name :hello]
      ["/health" :get health :route-name :health]
      ["/health/live" :get liveness :route-name :liveness]
      ["/health/ready" :get readiness :route-name :readiness]}))

(def service
  {::http/routes routes
    ::http/type :jetty
    ::http/port (Integer/parseInt (or (System/getenv "PORT") "8080"))
    ::http/join? false})

(defn -main [& _]
  (println "Pedestal running on port" (::http/port service))
  (-> service http/create-server http/start))
