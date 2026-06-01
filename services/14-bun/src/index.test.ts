import { describe, it, expect } from "bun:test";

describe("14-bun health endpoints", () => {
  it("GET /health returns ok", async () => {
    const res = await fetch("http://localhost:3000/health");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
