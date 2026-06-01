(ns 26_ring.core-test
  (:require [clojure.test :refer :all]
            [26_ring.core :refer [app]]
            [ring.mock.request :as mock]))

(deftest test-hello
  (let [resp (app (mock/request :get "/"))]
    (is (= 200 (:status resp)))))

(deftest test-health
  (let [resp (app (mock/request :get "/health"))]
    (is (= 200 (:status resp)))))

(deftest test-liveness
  (is (= 200 (:status (app (mock/request :get "/health/live"))))))

(deftest test-readiness
  (is (= 200 (:status (app (mock/request :get "/health/ready"))))))
