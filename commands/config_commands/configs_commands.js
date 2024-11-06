const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { Server, ReactionRole } = require('../../models/models.js'); // Import the Sequelize User model
const { logEvent } = require('../../events/logEvents.js');

const {
    createEmbed
} = require('../Utils_Functions/utils-embeds.js');

const reactionRoleConfigurations = new Map();

function getReactionRoleConfigurations() {
    return reactionRoleConfigurations;
}

module.exports = {
    // * Working
    setupWelcomeChannel: {
        execute: async (interaction) => {
            // Save the channel ID to your database for the server
            const serverId = interaction.guild.id;
            const serverName = interaction.guild.name; // Get the server name
            const user = interaction.user;
            
            logEvent(serverId, `Set Up Welcome Channel Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to set the welcome channel.', ephemeral: true });
            }
    
            // Get the channel from the command options
            const channel = interaction.options.getChannel('channel');
            if (!channel || channel.type !== 0) {
                return interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
            }
    
            try {
                // Update or create the server entry with the welcome channel ID and server name
                await Server.upsert({
                    serverId: serverId,
                    serverName: serverName, // Include serverName here
                    welcomeChannelId: channel.id
                }, {
                    where: { serverId: serverId }
                });
    
                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Welcome Channel Set')
                    .setDescription(`The welcome channel has been set to <#${channel.id}>`)
                    .setTimestamp();
    
                return await interaction.reply({ embeds: [embed] });
            } catch (err) {
                console.error('Failed to set the welcome channel:', err);
                return interaction.reply({ content: 'An error occurred while setting the welcome channel.', ephemeral: true });
            }
        }
    },    

    // //

    // * Working
    setupMuteRole: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            const user = interaction.user;
            logEvent(serverId, `Set Up Mute Role Was Run by <@${user.id}>`, 'low');
    
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                const noPermissionEmbed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('Permission Denied')
                    .setDescription('You do not have permission to manage roles.');
                return interaction.reply({ embeds: [noPermissionEmbed] });
            }
    
            // Defer the reply to avoid timeout issues
            await interaction.deferReply();
    
            try {
                // Role creation function to avoid duplication
                const getOrCreateRole = async (roleName) => {
                    const existingRole = interaction.guild.roles.cache.find(r => r.name === roleName);
                    if (existingRole) {
                        return existingRole;
                    } else {
                        const role = await interaction.guild.roles.create({
                            name: roleName,
                            permissions: [],
                        });
                        const roleCreatedEmbed = new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('Role Created')
                            .setDescription(`Created new role "${role.name}" with no permissions.`);
                        await interaction.followUp({ embeds: [roleCreatedEmbed] });
                        return role;
                    }
                };
    
                // Get or create Level 1 role (no talking but can see channels)
                let muteRoleLevel1 = await getOrCreateRole('Muted-Level-1');
    
                // Get or create Level 2 role (no talking and cannot see channels)
                let muteRoleLevel2 = await getOrCreateRole('Muted-Level-2');
    
                if (muteRoleLevel1 && muteRoleLevel2) {
                    // Update all channels with the appropriate permissions
                    await Promise.all(interaction.guild.channels.cache.map(async (channel) => {
                        try {
                            // Level 1: No sending messages but can see channels
                            const currentPermsLevel1 = channel.permissionOverwrites.cache.get(muteRoleLevel1.id);
                            if (!currentPermsLevel1 || currentPermsLevel1.deny.has(PermissionsBitField.Flags.SendMessages) === false) {
                                await channel.permissionOverwrites.edit(muteRoleLevel1, {
                                    SEND_MESSAGES: false,
                                    VIEW_CHANNEL: true
                                });
                            }
    
                            // Level 2: No sending messages and cannot see channels
                            const currentPermsLevel2 = channel.permissionOverwrites.cache.get(muteRoleLevel2.id);
                            if (
                                !currentPermsLevel2 ||
                                currentPermsLevel2.deny.has(PermissionsBitField.Flags.ViewChannel) === false ||
                                currentPermsLevel2.deny.has(PermissionsBitField.Flags.SendMessages) === false
                            ) {
                                await channel.permissionOverwrites.edit(muteRoleLevel2, {
                                    VIEW_CHANNEL: false,
                                    SEND_MESSAGES: false
                                });
                            }
                        } catch (err) {
                            console.error(`Error setting permissions in channel ${channel.name}:`, err);
                        }
                    }));
    
                    // Save mute roles in the database
                    try {
                        await Server.update(
                            { mute_role_level_1_id: muteRoleLevel1.id, mute_role_level_2_id: muteRoleLevel2.id },
                            { where: { serverId: interaction.guild.id } }
                        );
                    } catch (err) {
                        console.error('Error saving mute roles to database:', err);
                    }
    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('Mute Roles Set Up')
                        .setDescription('Mute roles have been set up successfully.');
                    await interaction.followUp({ embeds: [successEmbed] });
    
                } else {
                    const failureEmbed = new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setTitle('Role Creation Failed')
                        .setDescription('Failed to retrieve or create mute roles. Please try again later.');
                    await interaction.followUp({ embeds: [failureEmbed] });
                }
    
            } catch (err) {
                console.error('Failed to set up mute roles:', err);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('Error Setting Up Mute Roles')
                    .setDescription('There was an error setting up the mute roles. Please try again later.');
                await interaction.followUp({ embeds: [errorEmbed] });
            }
        }
    },
    
    // //

    // * Working
    setupLoggingChannel: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            const user = interaction.user;
            logEvent(serverId, `Set Up Logging Channel Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to manage channels', ephemeral: true });
            }

            await interaction.deferReply();
    
            // Get the channel from the slash command options, if provided
            let channel = interaction.options.getChannel('channel');
            
            // If no channel is provided, create a new category and text channel for logging
            if (!channel) {
                try {
                    // Create a new category
                    const category = await interaction.guild.channels.create({
                        name: 'Server Logs',
                        type: 4,
                    });
    
                    // Create a new text channel within the category
                    channel = await interaction.guild.channels.create({
                        name: 'logs',
                        type: 0,
                        parent: category.id, // Sets the category as parent
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone, // Restricts everyone from sending messages
                                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
                            },
                        ],
                    });
                } catch (err) {
                    console.error('Failed to create logging channel:', err);
                    return interaction.editReply({ content: 'An error occurred while creating the logging channel', ephemeral: true });
                }
            }
    
            // Ensure the channel is a text channel
            if (channel.type !== 0) {
                return interaction.editReply({ content: 'Please select a valid text channel', ephemeral: true });
            }
    
            // Fetch the server entry from the database
            const server = await Server.findOne({ where: { serverId: interaction.guild.id } });
            if (!server) {
                return interaction.editReply({ content: 'Server settings not found', ephemeral: true });
            }
    
            // Update the logging channel in the database
            try {
                await server.update({ loggingChannelId: channel.id });
    
                const embed = new EmbedBuilder()
                    .setTitle('Logging Channel Set')
                    .setDescription(`Logging channel has been set to <#${channel.id}>`)
                    .setColor(0x2ECC71);
    
                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('Failed to update logging channel:', err);
                await interaction.editReply({ content: 'An error occurred while setting the logging channel', ephemeral: true });
            }
        }
    },

    // //

    setupReactionRole: {
        execute: async (interaction) => {
            // Check for permission to manage roles
            const serverId = interaction.guild.id;
            const user = interaction.user;
            logEvent(serverId, `Set Up Reaction Roles Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }
    
            // Get the channel to send the message
            const channel = interaction.options.getChannel('channel');
    
            // Prompt user for configuration details
            await interaction.reply({ content: 'Let’s set up your reaction roles. Please reply with the roles, emojis, and message for the embed.' });
    
            // Use a collector to gather multiple pieces of information interactively
            const filter = m => m.author.id === interaction.user.id;
    
            // Step 1: Get roles and emojis
            await interaction.followUp('Please provide the roles and corresponding emojis in this format: `@Role1 :emoji1:, @Role2 :emoji2:`.');
    
            const rolesAndEmojisMessage = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
            const rolesAndEmojisContent = rolesAndEmojisMessage.first().content;
    
            // Check if user provided a valid response
            if (!rolesAndEmojisContent) {
                return interaction.followUp({ content: 'No roles and emojis provided.' });
            }
    
            // Step 2: Parse roles and emojis
            const rolesAndEmojis = rolesAndEmojisContent.split(',').map(item => {
                const [roleMention, emoji] = item.trim().split(/\s+/);
                const roleId = roleMention.match(/\d+/)[0]; // Extract role ID from mention
                return { roleId, emoji };
            });
    
            // Step 3: Get the embed message content
            await interaction.followUp('Please provide the message you want to display in the embed.');
    
            const embedMessageResponse = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
            const embedMessageContent = embedMessageResponse.first().content;
    
            // Step 4: Create and send the embed
            const reactionRoleEmbed = new EmbedBuilder()
                .setTitle('React to Get a Role!')
                .setDescription(embedMessageContent)
                .setColor(0xFFC0CB);
    
            // Send the embed message to the specified channel
            const message = await channel.send({ embeds: [reactionRoleEmbed] });
    
            // Add reactions to the message
            for (const { emoji } of rolesAndEmojis) {
                await message.react(emoji);
            }
    
            // Store the configuration for future reference
            if (!reactionRoleConfigurations.has(serverId)) {
                // If this is the first configuration for the server, initialize an array
                reactionRoleConfigurations.set(serverId, []);
            }
            // Add the new reaction role configuration to the server's array
            reactionRoleConfigurations.get(serverId).push({
                messageId: message.id,
                rolesAndEmojis
            });

            let messageId = message.id; 
            let channelId = channel.id;

            for (const { roleId, emoji } of rolesAndEmojis) {
                await ReactionRole.create({
                    guildId: serverId, messageId, channelId, emoji, roleId
                });
            }
    
            await interaction.followUp({ content: `Reaction role message has been set up in ${channel}.` });
        }
    },
    
    reactionRoleConfigurations,
    getReactionRoleConfigurations,

    // //

    setLevelupChannel: {
        execute: async (interaction) => {
            // Check for appropriate permission to manage channels
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
            }
    
            // Get the channel option from the command
            const channel = interaction.options.getChannel('channel');
            const guildId = interaction.guild.id;
            const serverName = interaction.guild.name; // Get the server name
    
            try {
                // Update or create the server configuration with the rank up channel
                await Server.upsert({
                    serverId: guildId,
                    serverName: serverName,
                    rankUpChannelId: channel.id
                });
    
                return interaction.reply({ content: `Rank-up messages will now be sent to ${channel}.` });
            } catch (error) {
                console.error('Error setting rank-up channel:', error);
                return interaction.reply({ content: 'An error occurred while setting the rank-up channel. Please try again later.', ephemeral: true });
            }
        }
    }
    
}