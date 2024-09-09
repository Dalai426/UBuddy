import { Injectable } from "@nestjs/common";
import "winston-daily-rotate-file";
import { AbstractConfigSet } from "winston/lib/winston/config";
import config from "../config/config";
import * as winston from "winston";

const { printf, combine, colorize, timestamp } = winston.format;

// Define log levels and colors
const logLevels: AbstractConfigSet = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    colors: {
        error: "red",
        warn: "yellow",
        info: "green",
        http: "blue",
        debug: "gray",
    },
};

// Add colors to winston
winston.addColors(logLevels.colors);

// Define log format
const jsonFormat = combine(
    timestamp(),
    colorize(),
    printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
    }),
);

// Define file format
const fileFormatter = combine(
    timestamp(),
    printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level}]: ${message}`;
    }),
);

@Injectable()
export class WinstonLogger {
    private readonly logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: config.log.winstonLevel || "info",
            transports: [
                new winston.transports.DailyRotateFile({
                    format: fileFormatter,
                    filename: "./logs/error-%DATE%.log",
                    level: "error",
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxFiles: "14d",
                }),
                new winston.transports.DailyRotateFile({
                    format: fileFormatter,
                    filename: "./logs/combined-%DATE%.log",
                    level: config.log.winstonLevel || "info",
                    datePattern: "YYYY-MM-DD",
                    zippedArchive: true,
                    maxFiles: "14d",
                }),
            ],
        });
        if (config.env === "development") {
            this.logger.add(
                new winston.transports.Console({
                    format: combine(colorize(), jsonFormat),
                }),
            );
        }
    }

    error(message: string, trace: string) {
        this.logger.error(`${message} - ${trace}`);
    }

    warn(message: string) {
        this.logger.warn(message);
    }

    debug(message: string) {
        this.logger.debug(message);
    }

    info(message: string) {
        this.logger.info(message);
    }

    http(message: string, tag?: string) {
        const metadata = {
            metadata: {
                tag: tag || "",
            },
        };
        this.logger.http(message, metadata);
    }
}
