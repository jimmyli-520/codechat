import "./config/loadEnv.js";
import { createApp } from "./app.js";
import { getServerConfig } from "./config/serverConfig.js";

const config = getServerConfig();
const app = createApp(config);

app.listen(config.port, config.host, () => {
  console.log(
    `CodeChat backend listening on http://${config.host}:${config.port}`
  );
  console.log(`Trusted frontend origins: ${config.trustedOrigins.join(", ")}`);
});
