-- CreateTable
CREATE TABLE "users" (
    "id"         TEXT          NOT NULL,
    "email"      TEXT          NOT NULL,
    "name"       TEXT          NOT NULL,
    "api_key"    TEXT,
    "provider"   TEXT          NOT NULL DEFAULT 'local',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id"          TEXT          NOT NULL,
    "title"       TEXT          NOT NULL,
    "description" TEXT,
    "user_id"     TEXT          NOT NULL,
    "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key"   ON "users"("email");
CREATE UNIQUE INDEX "users_api_key_key" ON "users"("api_key");

-- AddForeignKey
ALTER TABLE "items"
    ADD CONSTRAINT "items_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
