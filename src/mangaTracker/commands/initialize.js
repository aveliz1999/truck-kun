const {GuildSettings} = require('../../models');
const config = require('../../config').discord;

module.exports = {
    name: 'initialize',
    aliases: [
        'i',
        'init'
    ],
    shortDescription: 'Initialize the guild to work with truck-kun feeds.',
    description: 'Initialize the guild to work with truck-kun feeds.\n\n' +
        `► ${config.prefix} initialize {category_id} - Allow people to start subscribing. {category_id} is the ID of the channel category to create the feeds.`,
    execute: async function (client, message, arguments) {
        if (arguments.length !== 1) {
            return message.reply('Invalid arguments.');
        }

        const category = await client.channels.fetch(arguments[0]);
        if (!category || category.type !== 'category') {
            return message.reply('Invalid channel category ID.');
        }

        const existingGuildSettings = await GuildSettings.findOne({
            where: {
                guildId: message.guild.id
            }
        });
        if (existingGuildSettings) {
            await existingGuildSettings.update({
                categoryChannelId: category.id
            });
            return message.reply('Updated feed creation channel.');
        } else {
            await GuildSettings.create({
                guildId: message.guild.id,
                categoryChannelId: category.id
            });
            return message.reply('Guild initialized.')
        }
    }
}