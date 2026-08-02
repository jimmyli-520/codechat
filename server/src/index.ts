import "./config/loadEnv.js";
import { createApp } from "./app.js";
import { getServerConfig } from "./config/serverConfig.js";
import { databaseRecoveryMessage } from "./config/setupSupport.js";
import { ensureSchema, pool } from "./db/pool.js";

const config = getServerConfig();
const app = createApp(config);

try {
  await ensureSchema();

  app.listen(config.port, config.host, () => {
    console.log(
      `CodeChat backend listening on http://${config.host}:${config.port}`
    );
    console.log("PostgreSQL schema is ready.");
    console.log(`Trusted frontend origins: ${config.trustedOrigins.join(", ")}`);
  });
} catch (error) {
  console.error(databaseRecoveryMessage(error));
  await pool.end();
  process.exitCode = 1;
}
