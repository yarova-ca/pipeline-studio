(ns app.auth
  (:require [buddy.sign.jwt :as jwt]
            [buddy.hashers :as hashers])
  (:import [java.util Date]))

;; JWT_SECRET env var — falls back to "dev-secret" in development.
(def secret (or (System/getenv "JWT_SECRET") "dev-secret"))

;; sign-token — creates a HS256 JWT for the given user.
;; Token expires in 8 hours from issue time.
(defn sign-token [user-id email name]
  (let [now     (System/currentTimeMillis)
        exp-ms  (* 8 3600 1000)
        claims  {:id    (str user-id)
                 :email email
                 :name  name
                 :exp   (/ (+ now exp-ms) 1000)}]
    (jwt/sign claims secret {:alg :hs256})))

;; verify-token — decodes and validates a JWT string.
;; Returns the claims map on success. Throws on invalid/expired token.
(defn verify-token [token]
  (jwt/unsign token secret {:alg :hs256}))

;; hash-password — bcrypt hash a plaintext password.
(defn hash-password [password]
  (hashers/derive password {:alg :bcrypt+sha512}))

;; check-password — returns true when plaintext matches the stored hash.
(defn check-password [plaintext hash]
  (hashers/check plaintext hash))

;; extract-bearer — pulls the raw token from "Authorization: Bearer <token>".
;; Returns nil if header is missing or not a Bearer token.
(defn extract-bearer [request]
  (when-let [auth (get-in request [:headers "authorization"])]
    (when (.startsWith auth "Bearer ")
      (subs auth 7))))

;; auth-middleware — rejects requests with missing or invalid JWT.
;; Injects :claims into the request map on success.
(defn wrap-jwt-auth [handler]
  (fn [request]
    (let [token (extract-bearer request)]
      (if (nil? token)
        {:status 401 :headers {"Content-Type" "application/json"} :body "{\"error\":\"Unauthorized\"}"}
        (try
          (let [claims (verify-token token)]
            (handler (assoc request :claims claims)))
          (catch Exception _
            {:status 401 :headers {"Content-Type" "application/json"} :body "{\"error\":\"Unauthorized\""}))))))
