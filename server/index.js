import config from "./config.js";
import server from "./server.js";
import { logger } from "./util.js";

server.listen(config.port).on('listening', () => logger.info(`🔥 Server running in http://localhost:${config.port}`))

// impede que caia a aplicacao caia com um erro não tratado
// uncaughtException => Throw
// unhandledRejection => Promises
process.on('uncaughtException', (error) => logger.error(`uncaughtException happened: ${error.stack || error }`))
process.on('unhandledRejection', (error) => logger.error(`unhandledRejection happened: ${error.stack || error }`))