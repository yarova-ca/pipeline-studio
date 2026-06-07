import tracer from "dd-trace"
tracer.init({ service: process.env.DD_SERVICE ?? "14-express", env: process.env.DD_ENV ?? "production", logInjection: true })
export { tracer }
