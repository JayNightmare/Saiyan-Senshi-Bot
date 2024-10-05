const { 
    Client, 
    GatewayIntentBits, 
    Events, 
    Collection,
    REST, 
    Routes, 
    SlashCommandBuilder, 
    InteractionType, 
    ChannelType, 
    PermissionsBitField, 
    AuditLogEvent
} = require('discord.js');

const { EmbedBuilder } = require('@discordjs/builders');

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

const { MilestoneLevel, Server, User, Punishment, ReactionRole } = require('./models/models.js');
const { logEvent, processLogs } = require('./events/logEvents');

const {
    createEmbed
} = require('./commands/Utils_Functions/utils-embeds.js');

const {
    manageRoles
} = require('./commands/Utils_Functions/utils-roles.js');

const {
    getUserData,
    getUserCount
} = require('./commands/Utils_Functions/utils-user.js');

const {
    getServerData
} = require('./commands/Utils_Functions/utils-server.js');

const {
    // Milestone Roles
    checkAndGrantMilestoneRoles,
    giveRoleToUserIfNoneArrange,

    // Milestone Levels
    isMilestoneLevel
} = require('./commands/Utils_Functions/utils-milestones.js');

const {
    // Reaction Roles
    saveReactionRole,
    loadReactionRoles
} = require('./commands/Utils_Functions/utils-reactions.js');

// //

// Load Files
const adminCommands = require('./commands/admin_commands/admin_commands.js');
const communityCommands = require('./commands/community_commands/community_commands.js'); 
const configCommands = require('./commands/config_commands/configs_commands.js');
const milestoneCommands = require('./commands/milestone_commands/milestone_commands.js');
const { getReactionRoleConfigurations  } = require('./commands/config_commands/configs_commands.js');
const help_menu_selected = require('./events/help_menu_selected.js');
const ownerCommands = require('./commands/owner_commands/owner_commands.js');

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

    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with the bot'),

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

    // Configuration Setup Commands

    new SlashCommandBuilder() 
        .setName('setup-mute-role')
        .setDescription('Setup a mute role for the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    ,

    new SlashCommandBuilder()
        .setName('setup-logging-channel')
        .setDescription('Setup a logging channel for the server')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to')
                .setRequired(false)
        ),  
        
    new SlashCommandBuilder()
        .setName('setup-welcome-channel')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setDescription('Sets the channel for welcoming new members')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('setup-reaction-role')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)

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

    new SlashCommandBuilder()
        .setName('view-milestones')
        .setDescription('View the milestone levels and their associated roles')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

    // //

    new SlashCommandBuilder()
        .setName('setup-levelup-channel')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setDescription('Set the channel where level up messages will be sent')
        .addChannelOption(option => 
        option.setName('channel')
            .setDescription('The channel to send level up messages to.')
            .setRequired(true)
    ),

    // //

    new SlashCommandBuilder()
        .setName('refresh-reactions')
        .setDescription('Refresh the reaction roles if they stop working')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    // //

    // * Owner Commands
    new SlashCommandBuilder()
        .setName('server-call')
        .setDescription('Owner commands')
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
                // Check if the server already exists in the database
                const existingServer = await Server.findOne({ where: { serverId: guild.id } });
                
                // If the server already exists, skip creation
                if (existingServer) {
                    console.log(`Server ${guild.name} already exists in the database.`);
                } else {
                    // Create default entries for the server
                    await Server.create({
                        serverId: guild.id,
                        serverName: guild.name,
                        textChannelId: null,
                        loggingChannelId: null,
                        welcomeChannelId: null,
                        rankUpChannelId: null,
                        logLevel: 'low',
                        mute_role_level_1_id: null,
                        mute_role_level_2_id: null
                    });
                }
            } catch (error) {
                console.error(`Error adding guild to database: ${guild.name} (${guild.id})`, error);
            }
        }

        // Load reaction roles before registering slash commands
        await loadReactionRoles();
        const reactionRoleConfigurations = getReactionRoleConfigurations();
        console.log('Reaction role configurations loaded:', reactionRoleConfigurations);

        // List all reaction roles to the console
        for (const [guildId, configs] of reactionRoleConfigurations.entries()) {
            for (const config of configs) {
                try {
                    const guild = await client.guilds.fetch(guildId);
                    
                    console.log(`Fetching channel ID: ${config.channelId} for guild ${guild.name}`);
                    const channel = await guild.channels.fetch(config.channelId); // Explicitly fetch the channel
    
                    if (!channel) {
                        console.log(`Channel not found: ${config.channelId} in guild ${guild.name}`);
                        continue;
                    }
    
                    const message = await channel.messages.fetch(config.messageId);
    
                    // Iterate through the reactions on the message using a proper async loop
                    for (const reaction of message.reactions.cache.values()) {
                        const users = await reaction.users.fetch();
                        for (const user of users.values()) {
                            if (!user.bot) {
                                console.log(`Reaction found from user ${user.tag} on message ${message.id}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error processing guild ${guildId} and config ${config}:`, error);
                }
            }
        }

        // Register slash commands for each guild dynamically
        for (const guild of guilds.values()) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: commands }
                );
                console.log(`Successfully registered commands for guild: ${guild.id}`);
            } catch (error) {
                console.error(`Error registering commands for guild: ${guild.id}`, error);
            }
        }

        console.log('Successfully reloaded application (/) commands');
    } catch (error) {
        console.error('An error occurred during initialization:', error);
    }
});

client.on(Events.GuildCreate, async guild => {
    try {
        console.log(`Joined a new guild: ${guild.name} (ID: ${guild.id})`);

        // Check if the server already exists in the database
        const existingServer = await Server.findOne({ where: { serverId: guild.id } });
        
        // If the server already exists, skip creation
        if (existingServer) {
            console.log(`Server ${guild.name} already exists in the database.`);
            return;
        } else {
            // Create default entries for the server
            await Server.create({
                serverId: guild.id,
                serverName: guild.name,
                textChannelId: null,
                loggingChannelId: null,
                welcomeChannelId: null,
                rankUpChannelId: null,
                logLevel: 'low',
                mute_role_level_1_id: null,
                mute_role_level_2_id: null
            });
        }


        console.log(`Default entries created for server ${guild.name} (ID: ${guild.id})`);

        // You can also send a message to a system channel or owner of the server to say "Hello!"
        const systemChannel = guild.systemChannel;
        if (systemChannel) {
            systemChannel.send('Hello! Thank you for inviting me! Use `/help` to see what I can do!');
        }
    } catch (error) {
        console.error(`Error creating default server entry for ${guild.name}:`, error);
    }
});

client.on(Events.GuildDelete, async guild => {
    try {
        console.log(`Bot was removed from: ${guild.name} (ID: ${guild.id})`);

        await Server.destroy({ where: { serverId: guild.id } });
        await User.destroy({ where: { guildId: guild.id } });
        await MilestoneLevel.destroy({ where: { guildId: guild.id }});
        await Punishment.destroy({ where: { guildId: guild.id } });
        console.log(`Removed data for guild: ${guild.name}`);

    } catch (error) {
        console.error(`Error handling guildDelete for guild ${guild.name}:`, error);
    }
});

// //

client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return;
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
Yayyy! ${member.user}-sama has joined the fight to defend Earth with Son Goku and Sailor Moon.
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
    // If user is a bot, skip
    if (member.user.bot) return;

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
    if (!interaction.isCommand() && interaction.componentType!== 3) return;
    const { commandName, options, guildId } = interaction;    
    
    // Community commands
    if (commandName === 'profile') { console.log(`profile command ran`); await communityCommands.profile.execute(interaction); }
    if (commandName ==='setbio') { console.log(`setbio command ran`); await communityCommands.setBio.execute(interaction, options); }

    // Admin commands
    if (commandName === 'mod-ban') { console.log(`ban command ran`); await adminCommands.ban.execute(interaction, options); }
    if (commandName === 'mod-unban') { console.log(`unban command ran`); await adminCommands.unban.execute(interaction, options) }
    // //
    if (commandName === 'mod-kick') { console.log(`kick command ran`); await adminCommands.kick.execute(interaction, options); }
    // //
    if (commandName === 'mod-warn') { console.log(`warn command ran`); await adminCommands.warn.execute(interaction, options); }
    if (commandName ==='mod-remove-warning') { console.log(`rm warn command ran`); await adminCommands.removeWarning.execute(interaction, options); }
    // //
    if (commandName === 'mod-timeout') { console.log(`timeout command ran`); await adminCommands.timeout.execute(client, interaction, options, guildId); }
    // //
    if (commandName === 'mod-mute') { console.log(`mute command ran`); await adminCommands.mute.execute(interaction, options, guildId); }
    if (commandName === 'mod-unmute') { console.log(`unmute command ran`); await adminCommands.unmute.execute(interaction, options); }
    // //
    if (commandName === 'setup-mute-role') { console.log(`setup mute command ran`); await configCommands.setupMuteRole.execute(interaction, options); }
    if (commandName ==='setup-logging-channel') { console.log(`setup log command ran`); await configCommands.setupLoggingChannel.execute(interaction, options); }
    if (commandName === 'setup-welcome-channel') { console.log(`setup welcome command ran`); await configCommands.setupWelcomeChannel.execute(interaction, options); }
    if (commandName === 'setup-reaction-role') { console.log(`setup reaction command ran`); await configCommands.setupReactionRole.execute(interaction, options); }
    if (commandName === 'setup-milestone') { console.log(`setup milestone command ran`); await milestoneCommands.setupMilestone.execute(interaction, options); }
    if (commandName === 'setup-levelup-channel') { console.log(`setup levelup command ran`); await configCommands.setLevelupChannel.execute(interaction, options); }
    // //
    if (commandName === 'refresh-reactions') { console.log(`refresh reaction command ran`); await adminCommands.refreshReactions.execute(interaction); }
    // //
    if (commandName === 'remove-milestone') { console.log(`rm milestone command ran`); await milestoneCommands.removeMilestone.execute(interaction, options); }
    if (commandName === 'view-milestones') { console.log(`list milestone command ran`); await milestoneCommands.viewMilestones.execute(interaction); }
    // //
    if (commandName === 'help') { console.log(`help command ran`); await communityCommands.help.execute(interaction); }
    // //
    if (commandName === 'server-call') { console.log(`server call command ran`); await ownerCommands.serverCall.execute(interaction); }

    if (interaction.customId === 'help_menu') { await help_menu_selected.help_menu_selected.execute(interaction) }
});

// //

// When message is created, add xp
const cooldowns = new Map();

client.on('messageCreate', async (message) => {
    // Skip if user is bot
    if (message.author.bot) return;
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Fetch or create user data from the database
    let userData = await getUserData(guildId, userId);
    try {
        if (!userData) {
            userData = await User.create({
                userId: userId,
                username: message.author.username,
                guildId: guildId,
                bio: null,
                level: 0,
                xp: 0,
                warnings: null,
            });
        }
    } catch(err) {
        console.error('Error getting or creating user data:', err);
    }

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
    // // Check if the reaction is in a guild and not from a bot
    if (user.bot) return;

    try {
        // Fetch partial reactions and messages
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();
    } catch (err) {
        console.error('Error fetching partial reaction or message:', err);
        return; // Skip further processing if fetch fails
    }

    const guildId = reaction.message.guild.id;

    try {
        // Fetch all reaction roles for this message
        const existingRoles = await ReactionRole.findAll({
            where: {
                guildId: guildId,
                messageId: reaction.message.id,
            },
        });

        // If no reaction roles exist for this message, return
        if (!existingRoles || existingRoles.length === 0) {
            console.log(`No reaction role configuration found for message ID: ${reaction.message.id} in guild: ${guildId}`);
            return;
        }

        // Get the emoji identifier (custom vs standard)
        const emojiIdentifier = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

        // Find the role associated with the emoji
        const roleEntry = existingRoles.find(entry => entry.emoji === emojiIdentifier);
        if (!roleEntry) {
            console.log(`No role associated with emoji ${emojiIdentifier} for message ID: ${reaction.message.id}`);
            return;
        }

        // Get the role from the guild
        const role = reaction.message.guild.roles.cache.get(roleEntry.roleId);
        if (!role) {
            console.log(`Role not found in guild ${guildId} for role ID: ${roleEntry.roleId}`);
            return;
        }

        // Fetch the member who reacted
        const member = await reaction.message.guild.members.fetch(user.id);

        // Fetch the bot's highest role to compare with the role to be added
        const botMember = await reaction.message.guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;

        // Check if the bot has permission to manage roles and if its role is higher than the target role
        if (!reaction.message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log(`Bot lacks 'Manage Roles' permission in guild ${guildId}`);
            return;
        }

        if (botHighestRole.comparePositionTo(role) <= 0) {
            console.log(`Bot's role (${botHighestRole.name}) is not higher than the role to be added (${role.name})`);
            return; // Prevent adding the role to avoid the permission error
        }

        // Add the role to the member
        await member.roles.add(role);
        console.log(`Added role ${role.name} to user ${user.username}`);
    } catch (error) {
        console.error('Error adding role based on reaction:', error);
        return;
    }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
    // Check if the reaction is in a guild and not from a bot
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.partial) await reaction.fetch();
    if (user.bot) return;
    if (!reaction.message.guild) return;

    const guildId = reaction.message.guild.id;

    try {
        // Fetch all reaction roles for this message
        const existingRoles = await ReactionRole.findAll({
            where: {
                guildId: guildId,
                messageId: reaction.message.id,
            },
        });

        // If no reaction roles exist for this message, return
        if (!existingRoles || existingRoles.length === 0) {
            console.log(`No reaction role configuration found for message ID: ${reaction.message.id} in guild: ${guildId}`);
            return;
        }

        // Get the emoji identifier (custom vs standard)
        const emojiIdentifier = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

        // Find the role associated with the emoji
        const roleEntry = existingRoles.find(entry => entry.emoji === emojiIdentifier);
        if (!roleEntry) {
            console.log(`No role associated with emoji ${emojiIdentifier} for message ID: ${reaction.message.id}`);
            return;
        }

        // Get the role from the guild
        const role = reaction.message.guild.roles.cache.get(roleEntry.roleId);
        if (!role) {
            console.log(`Role not found in guild ${guildId} for role ID: ${roleEntry.roleId}`);
            return;
        }

        // Fetch the member who reacted
        const member = await reaction.message.guild.members.fetch(user.id);

        // Fetch the bot's highest role to compare with the role to be added
        const botMember = await reaction.message.guild.members.fetch(client.user.id);
        const botHighestRole = botMember.roles.highest;

        // Check if the bot has permission to manage roles and if its role is higher than the target role
        if (!reaction.message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            console.log(`Bot lacks 'Manage Roles' permission in guild ${guildId}`);
            return;
        }

        if (botHighestRole.comparePositionTo(role) <= 0) {
            console.log(`Bot's role (${botHighestRole.name}) is not higher than the role to be added (${role.name})`);
            return; // Prevent adding the role to avoid the permission error
        }

        // Add the role to the member
        await member.roles.remove(role);
        console.log(`Added role ${role.name} to user ${user.username}`);
    } catch (error) {
        console.error('Error adding role based on reaction:', error);
        return;
    }
});

// //

setInterval(() => processLogs(client), 180000);
client.login(process.env.LIVE_TOKEN);