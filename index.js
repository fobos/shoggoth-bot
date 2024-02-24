"use strict";

const { Telegraf } = require('telegraf');
const {v4: uuidv4}  = require('uuid');

const {initDb, logger} = require('./db');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply(`Привет. \nЯ бот для книжного клуба. Меня зовут Шоггот.`));
bot.help((ctx) => ctx.reply(`Привет, ${ctx.message.from.username}.\nЯ пока ничего не умею`));

// /add - добавить книгу в список
bot.command('add', (ctx) => {
    ctx.reply('Заглушка для функции добавления книг');
});

// /list - вернуть список добавленных книг
bot.command('list', async (ctx) => {
    const driver = await initDb();
    const result = await driver.tableClient.withSession(async (session) => {
        await selectBooks(session, logger);
    });
    await driver.destroy();
    logger.info('Driver destroyed');

    ctx.reply(result.reduce((acc, r) => {
        return acc + r + '\n';
    }, ''));
});

// Рекация на любой текс
bot.on('text', (ctx) => {
    ctx.reply(`Привет, ${ctx.message.from.username}`);
});

async function selectBooks(session, logger) {
    const query = 'SELECT * FROM `books_list`;';
    const {resultSets} = await session.executeQuery(query);
    logger.info("==========");
    logger.info(resultSets);

    const {rows} = resultSets[0];
    return rows.map((row) => {
        return Object.values(row.items[2])[0];
    });
}

module.exports.handler = async function (event, context) {
    const message = JSON.parse(event.body);
    await bot.handleUpdate(message);

    return {
        statusCode: 200,
        body: '',
    };
};