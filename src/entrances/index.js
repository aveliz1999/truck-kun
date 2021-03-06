const {Client, Collection} = require('discord.js');
const client = new Client();
const config = require('./config').discord
const fs = require('fs');
const {Entrance} = require('./models');
const ytdl = require('ytdl-core');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.commands = new Collection();
    const commands = fs.readdirSync('./commands').filter(file => file.endsWith('.js')).map(x => require(`./commands/${x}`));
    commands.forEach(command => {
        client.commands.set(command.name, command);
        command.aliases.forEach(alias => {
            client.commands.set(alias, command);
        });
    });
});

client.on('message', async message => {
    const {content} = message;
    const words = content.split(/[\s]/g);
    if (words[0].toLowerCase() === config.prefix || new RegExp(`<@!${client.user.id}>`).test(words[0])) {
        if (words.length < 2) {
            return;
        }

        const command = client.commands.get(words[1].toLowerCase());
        if (!command) {
            return message.reply(`No command ${words[1]}`);
        }

        try {
            await command.execute(client, message, words.splice(2));
        } catch (err) {
            console.error(err);
            return message.reply('An unexpected error occurred while executing this command.');
        }
    }
});

// Handle voice channel entrances
client.on('voiceStateUpdate', async (oldMember, newMember) => {
    const newUserChannel = newMember.channel

    if (newUserChannel !== null) {
        if (newUserChannel.id === config.entranceChannel) {
            const theme = await Entrance.findOne({
                where: {
                    user: newMember.member.id
                }
            });
            if (!theme) {
                return;
            }
            if (Date.now() - theme.lastUsed < 1800000) {
                return;
            }
            await theme.update({
                lastUsed: Date.now()
            });
            const connection = await newUserChannel.join();

            let dispatch = connection.play(ytdl(theme.url), {
                seek: parseInt(theme.start)
            }).on('start', () => {
                setTimeout(() => {
                    dispatch.destroy();
                }, parseInt(theme.time))
            })
        }
    }
});

client.login(config.token);