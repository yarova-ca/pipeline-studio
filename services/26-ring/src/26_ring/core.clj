(ns 26_ring.core
  (:require [ring.adapter.jetty :as jetty]
            [compojure.core :refer [defroutes GET]]
            [ring.middleware.json :refer [wrap-json-response]]
            [cheshire.core :as json])
  (:gen-class))

(defn json-response [body]
  {:status 200 :headers {"Content-Type" "application/json"} :body (json/generate-string body)})

(defroutes app-routes
  (GET "/" [] (json-response {:message "Hello from Ring 1.12" :framework "26-ring" :version "1.0.0"}))
  (GET "/health" [] (json-response {:status "ok" :version "1.0.0"}))
  (GET "/health/live" [] (json-response {:status "ok"}))
  (GET "/health/ready" [] (json-response {:status "ok"})))

(def app (wrap-json-response app-routes))

(defn -main [& _]
  (let [port (Integer/parseInt (or (System/getenv "PORT") "8080"))]
    (println (str "Ring running on port " port))
    (jetty/run-jetty app {:port port :join? false})))
