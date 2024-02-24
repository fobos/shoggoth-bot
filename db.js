"use strict";

const { getLogger, Driver, MetadataAuthService} = require('ydb-sdk');

const logger = getLogger();

async function initDb() {
    logger.info('Driver initializing...');

    const authService = new MetadataAuthService();
    const driver = new Driver({ endpoint: process.env.ENDPOINT, database: process.env.DATABASE, authService });

    const timeout = 10000;
    if (!(await driver.ready(timeout))) {
        logger.fatal(`Driver has not become ready in ${timeout}ms!`);
        process.exit(1);
    }
    logger.info('Driver ready');

    return driver;
}

module.exports = {
    logger,
    initDb
};
