(ns 26_pedestal.service-test
  (:require [clojure.test :refer :all]
            [io.pedestal.test :refer [response-for]]
            [26_pedestal.service :refer [service]]))

(def app (io.pedestal.http.impl.servlet-interceptor/http-interceptor-service-fn (::io.pedestal.http/interceptors (io.pedestal.http/create-server service))))

(deftest test-health
  (let [resp (response-for app :get "/health")]
    (is (= 200 (:status resp)))))
