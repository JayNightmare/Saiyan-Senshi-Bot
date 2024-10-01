const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder, InteractionType, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
// const path = require('path');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates] });
require('dotenv').config();
const rest = new REST({ version: '10' }).setToken(process.env.LIVE_TOKEN);

const { MilestoneLevel, Server, User } = require('./models/models.js');


const { logEvent, processLogs } = require('./events/logEvents');

const {
    // Embeds
    createEmbed,

    // Milestone Levels
    isMilestoneLevel,

    // Role Management
    manageRoles,

    // User Data
    getUserData,
    getUserCount,

    // Server Data
    getServerData
} = require('./commands/utils.js');

// Load Events
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, (...args) => event(client, ...args));
}

// Load Files
const adminCommands = require('./commands/admin_commands/admin_commands.js');
const communityCommands = require('./commands/community_commands/community_commands.js'); 

// Load Commands
const commands = [
    // Community Commands
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Check your profile or the profile of another user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view stats for')
                .setRequired(false)
        ),

    // //

    // Admin Commands
    new SlashCommandBuilder()
        .setName('mod-ban')
        .setDescription('Ban a user from the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)
    ),

    new SlashCommandBuilder()
        .setName('mod-unban')
        .setDescription('Unban a user from the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)
    ),

    // //

    new SlashCommandBuilder()
        .setName('mod-warning')
        .setDescription('Warn a user in the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(true)
    ),

    new SlashCommandBuilder()
        .setName('mod-remove-warning')
        .setDescription('Remove warning from user in server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The reason for the warn')
                .setRequired(true)
        ),

    // // 

    new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('The duration of the timeout in minutes (e.g., 10 for 10 minutes)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout')
                .setRequired(true)
    ),

    new SlashCommandBuilder()
        .setName('remove-timeout')
        .setDescription('Remove timeout from a user.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for removing the timeout')
                .setRequired(true)
    ),

    // //

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
            .setDescription('The duration of the timeout (e.g., 10m, 1h, 1d)')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute')
                .setRequired(true)
        ),
    
    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user in the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unmute')
                .setRequired(true)
        ),

    // //

    new SlashCommandBuilder() 
        .setName('setup-mute-role')
        .setDescription('Setup a mute role for the server.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The mute role')
                .setRequired(true)
        ),
    
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        console.log('Started refreshing application (/) commands.');

        // Fetch all guilds the bot is in
        const guilds = await client.guilds.fetch();

        guilds.forEach(async (guild) => {
            try {
                // Register slash commands for each guild dynamically
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: commands }
                );
                // console.log(`Successfully registered commands for guild: ${guild.id}`);
            } catch (error) {
                console.error(`Error registering commands for guild: ${guild.id}`, error);
            }
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    if (!interaction.isCommand()) return;
    const { commandName, options, guildId } = interaction;
    // let serverId = interaction.guild.id;

    if (commandName === 'profile') { await communityCommands.profile.execute(interaction); }

    // Admin commands
    if (commandName === 'ban') { await adminCommands.ban.execute(interaction, options); }
    if (commandName === 'unban') { await adminCommands.unban.execute(interaction, options) }
    // //
    if (commandName === 'warn') { await adminCommands.warn.execute(interaction, options); }
    if (commandName ==='remove-warning') { await adminCommands.removeWarning.execute(interaction, options); }
    // //
    if (commandName === 'timeout') { await adminCommands.timeout.execute(interaction, options, guildId); }
    if (commandName ==='remove-timeout') { await adminCommands.removeTimeout.execute(interaction, options); }
    // //
    if (commandName === 'mute') { await adminCommands.mute.execute(interaction, options, guildId); }
    if (commandName === 'unmute') { await adminCommands.unmute.execute(interaction, options); }
    // //
    if (commandName === 'setup-mute-role') { await adminCommands.setupMuteRole.execute(interaction, options); }
});

// When message is created, add xp
const cooldowns = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore bot messages
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Check for cooldowns (60 seconds)
    const now = Date.now();
    const cooldownAmount = 60 * 1000; // Cooldown set to 1 minute

    if (cooldowns.has(userId)) {
        const expirationTime = cooldowns.get(userId) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            console.log(`User ${message.author.username} is on cooldown. ${timeLeft.toFixed(1)} seconds remaining.`);
            return;
        }
    }

    // Set new cooldown
    cooldowns.set(userId, now);

    // Gain XP (5-10 XP randomly)
    const xpGain = Math.floor(Math.random() * 5) + 5;

    // Fetch or create user data from the database
    let userData = await getUserData(guildId, userId);
    if (!userData) {
        userData = await User.create({
            id: userId,
            username: message.author.username,
            guildId: guildId,
            bio: null,
            level: 0,
            xp: 0
        });
    }

    // Add XP and message count
    userData.xp += xpGain;
    userData.totalMessages += 1;

    // Level calculation logic
    const level = userData.level;
    const baseMultiplier = 100; // Base XP multiplier
    const scalingFactor = 1.1; // Scaling factor for level progression

    // XP needed for current and next level
    const xpNeededForCurrentLevel = Math.floor(level * baseMultiplier * Math.pow(scalingFactor, level));
    const xpNeededForNextLevel = Math.floor((level + 1) * baseMultiplier * Math.pow(scalingFactor, level + 1));
    const xpForNextLevel = xpNeededForNextLevel - xpNeededForCurrentLevel;

    // Check for level-up
    if (userData.xp >= xpForNextLevel) {
        userData.level += 1;
        userData.xp = 0; // Reset XP after leveling up

        console.log(`User leveled up to ${userData.level}`);

        // Send level-up message
        if (await isMilestoneLevel(guildId, userData.level)) {
            console.log(`User reached a milestone level: ${userData.level}`);
            message.channel.send(`🎉 Congrats <@${message.author.id}>! You've reached level ${userData.level}, a milestone level!`);
        } else {
            message.channel.send(`${message.author.username} leveled up to level ${userData.level}!`);
        }

        // Handle role and badge updates if necessary
        await manageRoles(message.member, userData.level, message.guild, message);
    }

    // Save updated user data to the database
    await userData.save();
}); 

setInterval(() => processLogs(client), 180000);

// Login to Discord
client.login(process.env.LIVE_TOKEN);
