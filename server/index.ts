import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log("Server index.ts started!");

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10); // Changed from 5000 to avoid conflict
  const host = "0.0.0.0";

  // Some platforms (for example Windows or certain hosted runtimes) don't support
  // the `reusePort` option. Try with reusePort when appropriate and gracefully
  // fall back to a plain listen if it's not supported.
  const listenWithFallback = async () => {
    const useReusePort = process.platform !== 'win32';
    const opts: any = useReusePort
      ? { port, host, reusePort: true }
      : { port, host };

    try {
      server.listen(opts, () => {
        log(`serving on port ${port}`);
      });
    } catch (err: any) {
      // If reusePort is not supported, try without it
      if (err && (err.code === 'ENOTSUP' || err.code === 'EISCONN' || err.code === 'ERR_SERVER_NOT_RUNNING')) {
        log('listen with reusePort failed, retrying without reusePort');
        server.listen(port, host, () => {
          log(`serving on port ${port}`);
        });
      } else {
        throw err;
      }
    }
  };

  listenWithFallback();
})();
