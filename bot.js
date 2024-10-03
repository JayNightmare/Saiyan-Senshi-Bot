const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    Collection,
    REST, 
    Routes, 
    SlashCommandBuilder, 
    InteractionType, 
    EmbedBuilder, 
    ChannelType, 
    PermissionsBitField, 
    AuditLogEvent, 
    Emoji, 
    ActionRowBuilder,
    StringSelectMenuBuilder} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION'
    ]
});

require('dotenv').config();
const rest = new REST({ version: '10' }).setToken(process.env.LIVE_TOKEN);

// //

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
    getServerData,
    checkAndGrantMilestoneRoles,
    giveRoleToUserIfNoneArrange
} = require('./commands/utils.js');

// //

// Load Files
const adminCommands = require('./commands/admin_commands/admin_commands.js');
const communityCommands = require('./commands/community_commands/community_commands.js'); 
const configCommands = require('./commands/config_commands/configs_commands.js');
const milestoneCommands = require('./commands/milestone_commands/milestone_commands.js');
const { getReactionRoleConfigurations  } = require('./commands/config_commands/configs_commands.js');

// //

// Load Commands
const commands = [
    // Community Commands
    new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Check your profile or the profile of another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view stats for')
                .setRequired(false)
        ),

    new SlashCommandBuilder()
        .setName('setbio')
        .setDescription('Set your bio')
        .addStringOption(option =>
            option.setName('bio')
                .setDescription('Your new bio')
                .setRequired(true)
    ),

    // //

    // Admin Commands
    new SlashCommandBuilder()
        .setName('mod-ban')
        .setDescription('Ban a user from the server')
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
        .setDescription('Unban a user from the server')
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
        .setName('mod-kick')
        .setDescription('Kick a user from the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking the user')
                .setRequired(false)
    ),

    // //

    new SlashCommandBuilder()
        .setName('mod-warn')
        .setDescription('Warn a user in the server')
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
        .setName('mod-timeout')
        .setDescription('Timeout a user for a specified duration')
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
                .setRequired(false)
    ),

    // //

    new SlashCommandBuilder()
        .setName('mod-mute')
        .setDescription('Mute a user in the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
            .setDescription('The duration of the timeout (10 = 10 minutes || 120 = 2 hours)')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('level')
            .setDescription('The level of the mute (1 - No Talk, Can See || 2 - No Talk, No See)')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the mute')
                .setRequired(false)
        ),
    
    new SlashCommandBuilder()
        .setName('mod-unmute')
        .setDescription('Unmute a user in the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose profile you want to view')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the unmute')
                .setRequired(false)
        ),

    // //

    new SlashCommandBuilder() 
        .setName('setup-mute-role')
        .setDescription('Setup a mute role for the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    ,

    new SlashCommandBuilder()
        .setName('setup-logging-channel')
        .setDescription('Setup a logging channel for the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to')
                .setRequired(false)
        ),  
        
    new SlashCommandBuilder()
        .setName('setup-welcome-channel')
        .setDescription('Sets the channel for welcoming new members')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('setup-reaction-role')
        .setDescription('Sets up a reaction role message')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the reaction role message will be sent')
                .setRequired(true)
    ),

    new SlashCommandBuilder()
        .setName('setup-milestone')
        .setDescription('Set a milestone level and the role to be granted on reaching that level')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level at which the milestone will be reached')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to grant when reaching the milestone level')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('remove-milestone')
        .setDescription('Remove a milestone level and its associated role')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The level at which the milestone will be reached')
                .setRequired(true)),
    
    // //

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with the bot'),

    // //

    new SlashCommandBuilder()
    .setName('setup-levelup-channel')
    .setDescription('Set the channel where level up messages will be sent.')
    .addChannelOption(option => 
        option.setName('channel')
            .setDescription('The channel to send level up messages to.')
            .setRequired(true)
    ),
].map(command => command.toJSON());

// //

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    try {
        console.log('Started refreshing application (/) commands');

        // Fetch all guilds the bot is in
        const guilds = await client.guilds.fetch();

        for (const guild of guilds.values()) {
            try {
                // Check if the guild is already in the database
                const [server, created] = await Server.findOrCreate({
                    where: { serverId: guild.id },
                    defaults: {
                        serverId: guild.id,
                        textChannelId: null,
                        loggingChannelId: null,
                        logLevel: 'low',
                        mute_role_level_1_id: null,
                        mute_role_level_2_id: null
                    }
                });
    
                if (created) {
                    console.log(`Added new server to database: ${guild.name} (${guild.id})`);
                } else {
                    console.log(`Server already exists in database: ${guild.name} (${guild.id})`);
                }
            } catch (error) {
                console.error(`Error adding guild to database: ${guild.name} (${guild.id})`, error);
            }
        }

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

        console.log('Successfully reloaded application (/) commands');
    } catch (error) {
        console.error(error);
    }
});

// //

client.on('guildMemberAdd', async (member) => {
    // Fetch the server entry to get the welcome channel ID
    const server = await Server.findOne({ where: { serverId: member.guild.id } });
    if (!server?.welcomeChannelId) return; // No welcome channel set

    // Get the welcome channel
    const welcomeChannel = member.guild.channels.cache.get(server.welcomeChannelId);
    if (!welcomeChannel || welcomeChannel.type !== 0) return;

    // Build the welcome message based on your reference
    const welcomeEmbed = new EmbedBuilder()
        .setTitle(`YAY! Welcome to ${member.guild.name} ${member.user.displayName}!`)
        .setDescription(`
Yayyy! ${member.user} -sama has joined the fight to defend Earth with Son Goku and Sailor Moon.
\nWe now have ${member.guild.memberCount} warriors to join the fight! But are you a Saiyan, a Senshi, or both?
\n\n${member.user}-sama, please select your roles to identify your training grounds, your identification, and other things Goku and Usagi will need to know (they are a bit clueless).`)
        .setColor(0x008080)
        .setImage('https://tenor.com/en-GB/view/kids-goku-peace-cool-shades-son-goku-gif-16874131.gif')
        .setFooter({ text: `Welcome to ${member.guild.name}` });

    // Send the message in the welcome channel
    try {
        await welcomeChannel.send({ embeds: [welcomeEmbed] });
    } catch (err) {
        console.error('Error sending welcome message:', err);
    }
});

client.on('guildMemberRemove', async (member) => {
    const kickAuditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberKick
    });

    const banAuditLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberBanAdd
    });

    const kickLog = kickAuditLogs.entries.first();
    const banLog = banAuditLogs.entries.first();

    const currentTime = Date.now();

    const wasKicked = kickLog && kickLog.target.id === member.id && currentTime - kickLog.createdTimestamp < 5000;
    const wasBanned = banLog && banLog.target.id === member.id && currentTime - banLog.createdTimestamp < 5000;

    if (wasKicked || wasBanned) return;

    // Fetch the server entry to get the goodbye channel ID
    const server = await Server.findOne({ where: { serverId: member.guild.id } });
    if (!server?.welcomeChannelId) return; // No goodbye channel set

    // Get the goodbye channel
    const goodbyeChannel = member.guild.channels.cache.get(server.welcomeChannelId);
    if (!goodbyeChannel || goodbyeChannel.type !== 0) return; // Invalid channel

    // Build the goodbye message
    const goodbyeEmbed = new EmbedBuilder()
        .setTitle(`${member.user.displayName}-san has left us...`) // Customize the title as you like
        .setDescription(`
O-oh... ... looks like <@${member.user.id}>-sama has left the fight to defend Earth with Son Goku and Sailor Moon. As they go to rest to King Kai, we hope they'll reincarnate and come back better than last time!
\n\n${member.user.displayName} will be remembered...
            \nWe are now left with **${member.guild.memberCount} senshi warriors** to continue the fight.`)
        .setColor(0x008080) // You can change the color
        .setImage('https://tenor.com/en-GB/view/sailor-moon-sad-anime-alone-gif-17542952.gif') // Use a goodbye GIF
        .setFooter({ text: `Goodbye from ${member.guild.name}` });

    // Send the message in the goodbye channel
    try {
        await goodbyeChannel.send({ embeds: [goodbyeEmbed] });
    } catch (err) {
        console.error('Error sending goodbye message:', err);
    }
});

// //

client.on('interactionCreate', async interaction => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    if (!interaction.isCommand()) return;
    const { commandName, options, guildId } = interaction;
    // let serverId = interaction.guild.id;

    // Community commands
    if (commandName === 'profile') { await communityCommands.profile.execute(interaction); }
    if (commandName ==='setbio') { await communityCommands.setBio.execute(interaction, options); }

    // Admin commands
    if (commandName === 'mod-ban') { await adminCommands.ban.execute(interaction, options); }
    if (commandName === 'mod-unban') { await adminCommands.unban.execute(interaction, options) }
    // //
    if (commandName === 'mod-kick') { await adminCommands.kick.execute(interaction, options); }
    // //
    if (commandName === 'mod-warn') { await adminCommands.warn.execute(interaction, options); }
    if (commandName ==='mod-remove-warning') { await adminCommands.removeWarning.execute(interaction, options); }
    // //
    if (commandName === 'mod-timeout') { await adminCommands.timeout.execute(client, interaction, options, guildId); }
    if (commandName ==='mod-remove-timeout') { await adminCommands.removetimeout.execute(interaction, options); }
    // //
    if (commandName === 'mod-mute') { await adminCommands.mute.execute(interaction, options, guildId); }
    if (commandName === 'mod-unmute') { await adminCommands.unmute.execute(interaction, options); }
    // //
    if (commandName === 'setup-mute-role') { await configCommands.setupMuteRole.execute(interaction, options); }
    if (commandName ==='setup-logging-channel') { await configCommands.setupLoggingChannel.execute(interaction, options); }
    if (commandName === 'setup-welcome-channel') { await configCommands.setupWelcomeChannel.execute(interaction, options); }
    if (commandName === 'setup-reaction-role') { await configCommands.setupReactionRole.execute(interaction, options); }
    if (commandName === 'setup-milestone') { await milestoneCommands.setupMilestone.execute(interaction, options); }
    if (commandName === 'setup-levelup-channel') { await configCommands.setLevelupChannel.execute(interaction, options); }
    // //
    if (commandName === 'remove-milestone') { await milestoneCommands.removeMilestone.execute(interaction, options); }
    // //
    if (commandName === 'help') {
        try {
            const options = [
                {
                    label: 'Admin Commands',
                    description: 'Commands for managing server settings',
                    value: 'admin_commands',
                },
                {
                    label: 'Community Commands',
                    description: 'Commands for community interactions',
                    value: 'community_commands',
                },
                {
                    label: 'Configuration Commands',
                    description: 'Commands for configuring the bot',
                    value: 'configuration_commands',
                },
                {
                    label: 'Help With Commands',
                    description: 'Help with commands for the bot',
                    value: 'command_help',
                }
            ];
    
            // Check if the user is the owner and add the Owner Commands option
            if (interaction.member.id === process.env.OWNER) {
                options.push({
                    label: 'Owner Commands',
                    description: 'Commands only available to the bot owner',
                    value: 'owner_commands',
                });
            }
    
            // Create the select menu and action row
            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('help_menu')
                        .setPlaceholder('Select a category')
                        .addOptions(options),
                );
    
            // Create the initial embed
            const optionEmbed = new EmbedBuilder()
                .setColor(0x3498db)
                .setTitle("Help")
                .setDescription("Choose an option below to see commands");
        
            // Reply with the embed and select menu
            await interaction.reply({ embeds: [optionEmbed], components: [row] });
        } catch (error) {
            console.error('An error occurred while creating the help embed:', error);
            interaction.reply({ content: 'An error occurred while generating the help message. Please contact the admin. **Error code: 0hb**', ephemeral: true });
        }
    }
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId === 'help_menu') {
        console.log('Menu Pressed')
        // const serverId = interaction.guild.id;
        let embed;
        switch (interaction.values[0]) {
            case 'admin_commands':
                embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle('Admin Commands')
                    .setDescription(`
                    • List of admin commands
                    `);
                break;
        
            case 'community_commands':
                embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle('Community Commands')
                    .setDescription(`
                    • List of community commands
                    `);
                break;
        
            case 'configuration_commands':
                embed = new EmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle('Configuration Commands')
                    .setDescription(`
                    • List of configuration commands
                    `);
                break;
        
            case 'owner_commands':
                // Check if the user is the bot owner
                if (interaction.user.id !== process.env.OWNER) {
                    return interaction.reply({ content: 'You do not have permission to view this section.', ephemeral: true });
                }
                embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Owner Commands')
                    .setDescription(`
                    • List of owner commands
                    `);
                break;
    
            case 'command_help':
                embed = new EmbedBuilder()
                    .setColor(0xffa500)
                    .setTitle('Help With Commands')
                    .setDescription(`
                        All commands use slash commands. If you want a new command or feature, please contact the [bot owner](https://discord.com/invite/W3bZxykvAX).
                    `);
                break;
        
            default:
                return;
        }
    
        // Validate and send the embed
        if (embed?.data && (embed.data.title || embed.data.description)) {
            await interaction.update({ embeds: [embed], components: [] }); // Use update to edit the original message
        } else {
            console.error('Attempted to send an embed with missing or invalid fields.');
            await interaction.reply({ content: 'There was an error generating the command list. Please try again later.', ephemeral: true });
        }
    } 
});

// //

// When message is created, add xp
const cooldowns = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore bot messages
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Fetch or create user data from the database
    let userData = await getUserData(guildId, userId);
    await giveRoleToUserIfNoneArrange(message.member, guildId, userData.level);

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

    if (userData.xp >= xpForNextLevel) {
        userData.level += 1;
        userData.xp = 0; // Reset XP after leveling up
    
        await checkAndGrantMilestoneRoles(message.member, guildId, userData.level, message);
    }

    // Save updated user data to the database
    await userData.save();
}); 

// //

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    console.log('Message Reaction Add reached');

    // Check if the reaction is in a guild and not from a bot
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;
    if (!reaction.message.guild) return;

    const guildId = reaction.message.guild.id;

    try {
        const reactionRoleConfigurations = getReactionRoleConfigurations();
        console.log('Current reactionRoleConfigurations:', reactionRoleConfigurations);

        // Get the configurations for this guild
        const guildConfig = reactionRoleConfigurations.get(guildId);
        if (!guildConfig) return console.log('No configuration found for this guild');

        // Find the specific message configuration within the guild
        const messageConfig = guildConfig.find(config => config.messageId === reaction.message.id);
        if (!messageConfig) return console.log('No configuration found for this message');

        // Get the emoji identifier (custom vs standard)
        let emojiIdentifier = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

        // Find the role associated with the emoji
        const roleEntry = messageConfig.rolesAndEmojis.find(entry => entry.emoji === emojiIdentifier);
        if (!roleEntry) return console.log('No role associated with this emoji');

        // Get the role from the guild
        const role = reaction.message.guild.roles.cache.get(roleEntry.roleId);
        if (!role) return console.log('Role not found in guild');

        // Get the guild member and add the role
        const member = await reaction.message.guild.members.fetch(user.id);

        // Get the bot's highest role to compare with the role to be added
        const botMember = await reaction.message.guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;

        // Check if the bot has permission to manage roles and if its role is higher than the target role
        if (!reaction.message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log(`Bot lacks the 'Manage Roles' permission.`);
            return;
        }

        if (botHighestRole.comparePositionTo(role) <= 0) {
            console.log(`Bot role ${botHighestRole.name} is not higher than the role to be added ${role.name}`);
            return; // Prevent adding the role to avoid the permission error
        }

        // Add the role to the member
        await member.roles.add(role);
        console.log(`Added role ${role.name} to user ${user.username}`);
    } catch (error) {
        console.error('Error in MessageReactionAdd:', error);
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    console.log('Message Reaction Remove reached');

    // Check if the reaction is in a guild and not from a bot
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;
    if (!reaction.message.guild) return;

    const guildId = reaction.message.guild.id;

    try {
        const reactionRoleConfigurations = getReactionRoleConfigurations();
        console.log('Current reactionRoleConfigurations:', reactionRoleConfigurations);

        // Get the configurations for this guild
        const guildConfig = reactionRoleConfigurations.get(guildId);
        if (!guildConfig) return console.log('No configuration found for this guild');

        // Find the specific message configuration within the guild
        const messageConfig = guildConfig.find(config => config.messageId === reaction.message.id);
        if (!messageConfig) return console.log('No configuration found for this message');

        // Get the emoji identifier (custom vs standard)
        let emojiIdentifier = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

        // Find the role associated with the emoji
        const roleEntry = messageConfig.rolesAndEmojis.find(entry => entry.emoji === emojiIdentifier);
        if (!roleEntry) return console.log('No role associated with this emoji');

        // Get the role from the guild
        const role = reaction.message.guild.roles.cache.get(roleEntry.roleId);
        if (!role) return console.log('Role not found in guild');

        // Get the guild member and add the role
        const member = await reaction.message.guild.members.fetch(user.id);

        // Get the bot's highest role to compare with the role to be added
        const botMember = await reaction.message.guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;

        // Check if the bot has permission to manage roles and if its role is higher than the target role
        if (!reaction.message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log(`Bot lacks the 'Manage Roles' permission.`);
            return;
        }

        if (botHighestRole.comparePositionTo(role) <= 0) {
            console.log(`Bot role ${botHighestRole.name} is not higher than the role to be added ${role.name}`);
            return; // Prevent adding the role to avoid the permission error
        }

        // Add the role to the member
        await member.roles.remove(role);
        console.log(`Added role ${role.name} to user ${user.username}`);
    } catch (error) {
        console.error('Error in MessageReactionAdd:', error);
    }
});

// //

setInterval(() => processLogs(client), 180000);
// Login to Discord
client.login(process.env.LIVE_TOKEN);