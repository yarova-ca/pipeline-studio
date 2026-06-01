(ns app.auth
  (:require [buddy.sign.jwt :as jwt]
            [buddy.hashers :as hashers]))

;; JWT_SECRET env var — falls back to "dev-secret" in development.
(def secret (or (System/getenv "JWT_SECRET") "dev-secret"))

;; sign-token — creates a HS256 JWT for the given user.
;; Token expires in 8 hours from issue time.
(defn sign-token [user-id email name]
  (let [now    (System/currentTimeMillis)
        exp-ms (* 8 3600 1000)
        claims {:id    (str user-id)
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

;; jwt-auth-interceptor — Pedestal interceptor that:
;; 1. Reads "Authorization: Bearer <token>" from the request.
;; 2. Rejects with 401 if header is missing or token is invalid.
;; 3. Injects :claims into the request context on success.
(def jwt-auth-interceptor
  {:name  ::jwt-auth
   :enter (fn [ctx]
            (let [auth-header (get-in ctx [:request :headers "authorization"])]
              (if (and auth-header (.startsWith auth-header "Bearer "))
                (let [token (subs auth-header 7)]
                  (try
                    (let [claims (verify-token token)]
                      (assoc-in ctx [:request :claims] claims))
                    (catch Exception _
                      (assoc ctx :response
                        {:status 401
                         :headers {"Content-Type" "application/json"}
                         :body "{\"error\":\"Unauthorized\"}"}))))
                (assoc ctx :response
                  {:status 401
                   :headers {"Content-Type" "application/json"}
                   :body "{\"error\":\"Unauthorized\"}"}))))})
