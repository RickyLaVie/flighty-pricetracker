import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { startScheduler } from "@/lib/scheduler/scheduler";

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
});

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`[server] Starting — NODE_ENV=${process.env.NODE_ENV} port=${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      const parsedUrl = parse(req.url ?? "/", true);
      await handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`[server] Ready on http://${hostname}:${port}`);
      startScheduler();
    });
  })
  .catch((err) => {
    console.error("[server] app.prepare() failed:", err);
    process.exit(1);
  });
