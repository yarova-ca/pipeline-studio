import { json } from "@solidjs/start";
export function GET() {
  return json({ status: "ok", version: "1.0.0" });
}
