import client from "prom-client"
client.collectDefaultMetrics({ prefix: "app_" })
export const register = client.register
