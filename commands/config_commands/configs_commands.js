const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { createEmbed } = require('../utils');
const { Server, User } = require('../../models/models.js'); // Import the Sequelize User model
const { logEvent, processLogs } = require('../../events/logEvents.js');


module.exports = {
    setWelcomeChannel: {
        execute: async (interaction) => {
            // Save the channel ID to your database for the server
            const serverId = interaction.guild.id;
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
                // Update or create the server entry with the welcome channel ID
                await Server.upsert({
                    serverId: serverId,
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

    // * Working
    setupMuteRole: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            const user = interaction.user;
            logEvent(serverId, `Set Up Mute Role Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply('You do not have permission to manage roles');
            }
    
            await interaction.deferReply();

            // Role creation function to avoid duplication
            const createRole = async (roleName, level) => {
                const existingRole = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (!existingRole) {
                    try {
                        const role = await interaction.guild.roles.create({
                            name: roleName,
                            permissions: [], // No permissions
                        });
    
                        const embed = createEmbed(`Mute Role Level ${level} Created`, `Created new role "${role.name}" with no permissions`, 0x2ECC71);
                        await interaction.editReply({ embeds: [embed] });
                        return role;
                    } catch (err) {
                        console.error(`Failed to create ${roleName} role:`, err);
                        const embed = createEmbed('Failed to create new role', `Failed to create "${roleName}" role`, 0xE74C3C);
                        return interaction.editReply({ embeds: [embed] });
                    }
                } else {
                    const embed = createEmbed(`Mute Role Level ${level} Already Exists`, `Role "${existingRole.name}" already exists`, 0xF1C40F);
                    await interaction.editReply({ embeds: [embed] });
                    return existingRole;
                }
            };
    
            // Create Level 1 role (no talking but can see channels)
            const muteRoleLevel1 = await createRole('Muted-Level-1', 1);
    
            // Create Level 2 role (no talking and cannot see channels)
            const muteRoleLevel2 = await createRole('Muted-Level-2', 2);
    
            // Update all channels with the appropriate permissions
            interaction.guild.channels.cache.forEach(channel => {
                // For Level 1: No talking but can see channels
                channel.permissionOverwrites.create(muteRoleLevel1, {
                    SendMessages: false,
                    Connect: false, 
                }).catch(console.error);
    
                // For Level 2: No talking and cannot see channels
                channel.permissionOverwrites.create(muteRoleLevel2, {
                    ViewChannel: false, 
                    SendMessages: false,
                    Connect: false,
                }).catch(console.error);
            });
    
            try {
                await Server.update(
                    { mute_role_level_1_id: muteRoleLevel1.id, mute_role_level_2_id: muteRoleLevel2.id },
                    { where: { serverId: interaction.guild.id } }
                );
            } catch (err) {
                console.error('Error saving mute roles to database:', err);
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
    }
}