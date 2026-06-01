(ns app.routes
  (:require [compojure.core :refer [defroutes GET POST DELETE context]]
            [ring.middleware.json :refer [wrap-json-body wrap-json-response]]
            [cheshire.core :as json]
            [app.auth :as auth]
            [app.db :as db]))

(defn json-response [status body]
  {:status status :headers {"Content-Type" "application/json"} :body (json/generate-string body)})

;; POST /auth/register — hash password, create user, return JWT.
(defn register-handler [request]
  (let [{:keys [email name password]} (:body request)]
    (if (or (nil? email) (nil? password))
      (json-response 400 {:error "missing email or password"})
      (let [hash (auth/hash-password password)
            user (db/create-user! email name hash)
            token (auth/sign-token (:users/id user) email name)]
        (json-response 201 {:token token})))))

;; POST /auth/login — verify credentials, return JWT.
(defn login-handler [request]
  (let [{:keys [email password]} (:body request)
        user (db/find-user-by-email email)]
    (if (and user (auth/check-password password (:users/password_hash user)))
      (let [token (auth/sign-token (:users/id user) email (:users/name user))]
        (json-response 200 {:token token}))
      (json-response 401 {:error "Invalid credentials"}))))

;; GET /items — list items owned by the authenticated user.
(defn list-items-handler [request]
  (let [user-id (get-in request [:claims :id])
        items   (db/get-items-for-user (Integer/parseInt user-id))]
    (json-response 200 items)))

;; POST /items — create item for the authenticated user.
(defn create-item-handler [request]
  (let [title   (get-in request [:body :title])
        user-id (get-in request [:claims :id])]
    (if (nil? title)
      (json-response 400 {:error "missing title"})
      (let [item (db/create-item! title (Integer/parseInt user-id))]
        (json-response 201 item)))))

;; DELETE /items/:id — delete item owned by the authenticated user.
(defn delete-item-handler [request]
  (let [item-id (Integer/parseInt (get-in request [:route-params :id]))
        user-id (Integer/parseInt (get-in request [:claims :id]))
        result  (db/delete-item! item-id user-id)]
    (if (pos? (:next.jdbc/update-count result))
      {:status 204 :body ""}
      (json-response 404 {:error "not found"}))))

(defroutes public-routes
  (context "/auth" []
    (POST "/register" request (register-handler request))
    (POST "/login"    request (login-handler    request))))

(defroutes protected-routes
  (context "/items" []
    (GET    "/"    request (list-items-handler   request))
    (POST   "/"    request (create-item-handler  request))
    (DELETE "/:id" request (delete-item-handler  request))))

(def app
  (-> (compojure.core/routes public-routes (auth/wrap-jwt-auth protected-routes))
      wrap-json-body
      wrap-json-response))
