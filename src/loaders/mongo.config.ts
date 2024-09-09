// import { Module, OnModuleInit } from "@nestjs/common";
// import mongoose, { Connection } from "mongoose";
// import config from "../config/config";
// import { WinstonLogger } from "./winston.logger";

// declare module "mongoose" {
//     export let app: Connection;
//     export let nut: Connection;
//     export let promo: Connection;
// }

// @Module({
//     imports: [],
// })
// export class MongooseConfigModule implements OnModuleInit {
//     constructor(private readonly logger: WinstonLogger) {}
//     async onModuleInit() {
//         mongoose.Promise = Promise;

//         if (process.env.NODE_ENV === "gitlabci") {
//             mongoose.app = new mongoose.Connection();
//             mongoose.nut = new mongoose.Connection();
//             mongoose.promo = new mongoose.Connection();
//         } else {
//             mongoose.app = mongoose.createConnection(config.mongoDB.appURI);
//             mongoose.nut = mongoose.createConnection(config.mongoDB.nutURI);
//             mongoose.promo = mongoose.createConnection(config.mongoDB.promoURI);
//         }

//         this.setupConnectionEvents(mongoose.app);
//         this.setupConnectionEvents(mongoose.nut);
//         this.setupConnectionEvents(mongoose.promo);
//     }

//     private setupConnectionEvents(connection: Connection) {
//         connection.on("connected", () =>
//             this.logger.info(
//                 `Database connection to [${(connection.db && connection.db.databaseName) || "null"}]: SUCCESSFUL`,
//             ),
//         );
//         connection.on("disconnected", () =>
//             this.logger.info(
//                 `Database connection to [${(connection.db && connection.db.databaseName) || "null"}]: DISCONNECTED`,
//             ),
//         );
//         connection.on("reconnected", () =>
//             this.logger.info(
//                 `Database connection to [${(connection.db && connection.db.databaseName) || "null"}]: RECONNECTED`,
//             ),
//         );
//         connection.on("error", (error: Error) =>
//             this.logger.error(`Error: ${error.message}`, "DB-EVENTS"),
//         );
//     }
// }

// // class MongooseConfigService implements MongooseOptionsFactory {
// //     createMongooseOptions(): MongooseModuleOptions {
// //         return {
// //             uri: config.mongoDB.appURI,
// //             useNewUrlParser: true,
// //             useUnifiedTopology: true,
// //             minPoolSize: 5,
// //             maxPoolSize: 10,
// //         };
// //     }
// // }
