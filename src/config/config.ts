import * as fs from "fs";
import * as dotenv from "dotenv";

if (fs.existsSync(".env")) {
    dotenv.config({ path: ".env" });
}

const config = {
    serviceName: process.env.SERVICE_NAME,
    env: process.env.NODE_ENV,
    port: process.env.NODE_PORT,
    log: {
        winstonLevel: process.env.LOG_LEVEL || "silly",
    }
};

export default config;
