"use strict";

const { Telegraf} = require('telegraf');
const { TypedData } = require('ydb-sdk');
const {v4: uuidv4}  = require('uuid');

const {initDb, logger} = require('./db');


const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply(`Привет. \nЯ бот для книжного клуба. Меня зовут Шоггот.`));
bot.help((ctx) => ctx.reply(`Привет, ${ctx.message.from.username}.\nЯ пока ничего не умею`));

// /add - добавить книгу в список
bot.command('add', async (ctx) => {
    const driver = await initDb();
    const query = `
        UPSERT INTO books_list (id, tg_login, title, created_at)
        VALUES (
            '${uuidv4()}',
            '${ctx.message.from.username}',
            '${ctx.payload}',
            DateTime::MakeDatetime(DateTime::FromSeconds(${ctx.message.date}))
        );
    `;

    await driver.tableClient.withSession(async (session) => {
        logger.info('Making an upsert...');
        await session.executeQuery(query);
        logger.info('Upsert completed');
    });

    await driver.destroy();
    logger.info('Driver destroyed');

    ctx.reply('👍');
});

// /list - вернуть список добавленных книг
bot.command('list', async (ctx) => {
    const driver = await initDb();
    const result = await driver.tableClient.withSession(async (session) => {
        const query = 'SELECT * FROM books_list ORDER BY created_at;';
        const {resultSets} = await session.executeQuery(query);

        return TypedData.createNativeObjects(resultSets[0]);
    });
    await driver.destroy();
    logger.info('Driver destroyed');

    ctx.reply(result.reduce((acc, book) => {
        return acc + book.title + '\n';
    }, ''));
});

// Рекация на любой текст
bot.on('text', (ctx) => {
    ctx.reply(`Привет, ${ctx.message.from.username}`);
});

module.exports.handler = async function (event, context) {
    const message = JSON.parse(event.body);
    await bot.handleUpdate(message);

    return {
        statusCode: 200,
        body: '',
    };
};