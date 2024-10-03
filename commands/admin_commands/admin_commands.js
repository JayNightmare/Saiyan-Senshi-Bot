const { createEmbed } = require('../utils');
const { MilestoneLevel, Server, User } = require('../../models/models.js');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logEvent, processLogs } = require('../../events/logEvents.js');

module.exports = {
    // * Working
    ban: {
        execute: async (interaction, args) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Ban Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return interaction.reply('You do not have permission to manage roles');

            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            if (!member) return interaction.reply('Please mention a user to ban');

            const userEmbed = new EmbedBuilder()
                    .setTitle("You've been Banned")
                    .setDescription(`You have been banned from **${interaction.guild.name}**`)
                    .setColor(0x008080)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: `<@${interaction.user.id}>` }
                    );

            await user.send({ embeds: [userEmbed] });
    
            member.ban()
                .then(() => {
                    const embed = new EmbedBuilder()
                        .setTitle(`${user.displayName}-san has been banned!`) // Use `ban` or `kick` as appropriate
                        .setDescription(`"Hmph, serves them right! We can still fight with **${interaction.guild.memberCount} senshi warriors**!"\n\nRest in peace, <@${user.id}> won't be missed.`)
                        .setColor(0x008080) // Set color as appropriate for ban/kick
                        .setImage('https://tenor.com/en-GB/view/dragon-ball-super-goku-kamehameha-wave-gif-14323063.gif') // Set the image URL as per your example
                        .setFooter({ text: `Action by: ${interaction.user.tag}` });

                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to ban the user');
                    console.error(err);
                });
        }
    },

    // * Working
    unban: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Unban Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({ content: 'You do not have permission to unban users', ephemeral: true });
            }
    
            // Get the user and reason from the interaction options
            user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
    
            // Check if the user exists
            if (!user) return interaction.reply({ content: 'Please mention a valid user to unban', ephemeral: true });
    
            // Fetch the bans from the guild
            try {
                const bans = await interaction.guild.bans.fetch();
                const bannedUser = bans.get(user.id);
    
                if (!bannedUser) {
                    return interaction.reply({ content: 'The specified user is not banned', ephemeral: true });
                }
    
                // Unban the user
                await interaction.guild.members.unban(user.id, reason);
    
                const embed = new EmbedBuilder()
                    .setTitle(`${user.displayName} Unbanned`)
                    .setDescription(`<@${user.id}> was unbanned from the server`)
                    .setColor(0x2ECC71)
                    .addFields({ name: 'Reason', value: reason });
    
                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                console.error('Error unbanning user:', err);
                return interaction.reply({ content: 'An error occurred while trying to unban the user', ephemeral: true });
            }
        }
    },   
    
    // //

    // * Working
    kick: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Kick Was Run by <@${user.id}>`, 'low');
            // Check if the member has permission to kick users
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ content: 'You do not have permission to kick members', ephemeral: true });
            }
    
            // Get the user to kick and the reason for the kick
            user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
    
            // Ensure the user is part of the server
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: 'Please provide a valid user to kick', ephemeral: true });
    
            // Check if the bot can kick this user (check role hierarchy)
            if (!member.kickable) {
                return interaction.reply({ content: 'I cannot kick this user. Please check my role permissions', ephemeral: true });
            }
    
            // Attempt to kick the user
            try {
                const userEmbed = new EmbedBuilder()
                    .setTitle('User Kicked')
                    .setDescription(`You have been kicked from **${interaction.guild.name}**`)
                    .setColor(0x008080)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: `<@${interaction.user.id}>` }
                    );

                await user.send({ embeds: [userEmbed] });

                // Kick the user from the server
                await member.kick(reason);

                await interaction.deferReply()

                // Create an embed to confirm the kick
                const embed = new EmbedBuilder()
                    .setColor(0x008080) // Set color as appropriate for ban/kick
                    .setTitle(`${user.displayName}-san has been kicked!`)
                    .setDescription(`"Hmph, serves them right! We can still fight with **${interaction.guild.memberCount} senshi warriors**!"\n\nRest in peace, <@${user.id}> won't be missed.`)
                    .setImage('https://tenor.com/en-GB/view/dragon-ball-super-goku-kamehameha-wave-gif-14323063.gif') 
                    .setFooter({ text: `Action by: ${interaction.user.tag}` })

                return await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('Error kicking user:', err);
                return await interaction.editReply({ content: 'An error occurred while trying to kick the user', ephemeral: true });
            }
        }
    },

    // //

    // * Working
    warn: {
        execute: async (interaction) => {
            let serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Warn Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply('You do not have permission to issue warnings');
            }
    
            // Get the user to warn and the reason for the warning
            user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';
    
            // Fetch the member to ensure they're in the server
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply('Please mention a valid user to warn');
    
            let userData;
    
            try {
                // Fetch or create the user entry in the database
                userData = await User.findOrCreate({
                    where: { userId: user.id, guildId: interaction.guild.id },
                    defaults: {
                        userId: user.id,
                        username: user.username,
                        guildId: interaction.guild.id,
                        level: 0,
                        xp: 0,
                        warnings: 1, // Initialize with 1 warning if creating a new entry
                    }
                });
    
                // If userData already exists, increment warnings
                if (!userData[1]) { // userData[1] is true if a new record was created
                    userData = userData[0]; // Get the existing record
                    userData.warnings += 1;
                    await userData.save();
                } else {
                    userData = userData[0]; // Get the newly created record
                }
    
                const embed = new EmbedBuilder()
                    .setTitle(`${user.displayName} Warned`)
                    .setDescription(`<@${member.id}> has been warned`)
                    .setColor( 0x008080 )
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Total Warnings', value: `${userData.warnings}` }
                    );
    
                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                console.error('Database error:', err);
                return interaction.reply('An error occurred while warning the user');
            }
        }
    },       

    // * Working
    removeWarning: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Remove Warning Was Run by <@${user.id}>`, 'low');
            // Check for appropriate permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ content: 'You do not have permission to manage warnings', ephemeral: true });
            }
    
            // Get the user to remove a warning from
            user = interaction.options.getUser('user');
    
            // Fetch the member to ensure they're in the server
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) return interaction.reply({ content: 'Please mention a valid user to remove a warning', ephemeral: true });
    
            let userData;
    
            try {
                // Fetch or create the user entry in the database
                userData = await User.findOrCreate({
                    where: { userId: user.id, guildId: interaction.guild.id },
                    defaults: {
                        userId: user.id,
                        username: user.username,
                        guildId: interaction.guild.id,
                        level: 0,
                        xp: 0,
                        warnings: 1, // Initialize with 1 warning if creating a new entry
                    }
                });
    
                userData = userData[0]; // Get the user record
    
                // Check if user has warnings to remove
                if (userData.warnings <= 0) {
                    return interaction.reply({ content: 'This user has no warnings to remove', ephemeral: true });
                }
    
                // Decrement the warning count
                userData.warnings -= 1;
                await userData.save();
    
                // Create a success embed message
                const embed = new EmbedBuilder()
                    .setTitle(`Warning Removed from ${user.displayName}`)
                    .setDescription(`A warning has been removed from <@${member.id}>`)
                    .setColor(0x008080)
                    .addFields({ name: 'Remaining Warnings', value: `${userData.warnings}` });
    
                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                console.error('Database error:', err);
                return interaction.reply({ content: 'An error occurred while removing the warning', ephemeral: true });
            }
        }
    },

    // //

    // * Working
    timeout: {
        execute: async (client, interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Timeout Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return interaction.reply('You do not have permission to manage roles');

            // Get the user from the interaction options
            user = interaction.options.getUser('user'); // Get the user object
            if (!user) return interaction.reply('Please mention a valid user to time out');
    
            // Fetch the member from the guild (necessary to access guild-specific actions)
            const member = await interaction.guild.members.fetch(user.id);
            if (!member) return interaction.reply('Could not find that member in this guild');
    
            // Get duration from slash command
            const duration = parseInt(interaction.options.get('duration').value); 
            if (!duration) return interaction.reply('Please provide a valid duration in minutes');
            if (duration < 1) return interaction.reply('Duration must be at least 1 minute');
    
            // Reason for timeout
            const reason = interaction.options.get('reason')?.value || 'No reason provided';

            if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
                return interaction.reply({ 
                    content: `<@${member.id}> is already timed out until ${member.communicationDisabledUntil.toLocaleString()}`, 
                    ephemeral: true 
                });
            }
    
            try {
                // Convert duration from minutes to milliseconds
                const durationMs = duration * 60 * 1000;

                // if duration is greater than 40320 mintues, return with "too long"
                if (duration > 40320) return interaction.reply('Duration cannot exceed 40320 minutes');
    
                // Apply the timeout
                await member.timeout(durationMs, reason);
    
                // Create a success embed
                console.log(`Try: <@${interaction.user.id}>`);
                console.log(`Try: ${reason}`);
                console.log(`Try: ${duration}`);

                const embed = new EmbedBuilder()
                    .setTitle(`${user.displayName} Timed Out`)
                    .setDescription(`<@${member.id}> was timed out`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: true},
                        { name: 'Duration', value: `${duration} minute(s)`, inline: true},
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setColor(0x2ECC71);
    
                interaction.reply({ embeds: [embed] });
            } catch (err) {
                // Create an error embed
                console.log(`Error: <@${interaction.user.id}>`);
                console.log(`Error: ${reason}`);
                console.log(`Error: ${duration}`);

                const embed = new EmbedBuilder()
                    .setTitle(`Error Timing Out ${user.displayName}`)
                    .setDescription(`Could not time out <@${member.id}>`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: true},
                        { name: 'Duration', value: `${duration} minute(s)`, inline: true},
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setColor(0xE74C3C);
    
                interaction.reply({ embeds: [embed] });
                console.error(err);
            }
        }
    }, 
    
    // //

    // * Working
    mute: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Mute Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply('You do not have permission to manage roles');
            }
    
            // Get the member to mute and the level of mute
            const member = interaction.guild.members.cache.get(interaction.options.getUser('user').id);
            const level = interaction.options.getInteger('level'); // Assumes level is an integer option in the slash command
            if (!member) return interaction.reply('Please mention a user to mute');

            const reason = interaction.options.get('reason')?.value || 'No reason provided';
            const duration = interaction.options.getInteger('duration');
    
            // Fetch the server's mute roles from the database
            const server = await Server.findOne({ where: { serverId: interaction.guild.id } });
            if (!server) return interaction.reply('Server settings not found');
    
            // Choose the correct role based on the level
            const muteRoleId = level === 2 ? server.mute_role_level_2_id : server.mute_role_level_1_id;
    
            if (!muteRoleId) return interaction.reply('Mute role not set for the specified level');

            // Check if member already has a mute role
            if (member.roles.cache.has(muteRoleId)) {
                const embed = new EmbedBuilder()
                    .setTitle(`${user.displayName} Already Muted`)
                    .setDescription(`Could not muted: <@${member.id}>`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: true},
                        { name: 'Duration', value: `${duration} minute(s)`, inline: true},
                        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setColor(0xE74C3C);
    
                await interaction.reply({ embeds: [embed] });
            }
    
            const durationMs = duration * 60 * 1000;

            // Apply the mute role to the member
            member.roles.add(muteRoleId)
                .then(() => {
                    const embed = new EmbedBuilder()
                        .setTitle(`${user.displayName} Muted`)
                        .setDescription(`Muted: <@${member.id}>`)
                        .addFields(
                            { name: 'Reason', value: reason, inline: true },
                            { name: 'Duration', value: `${duration} minute(s)`, inline: true },
                            { name: 'Level', value: level.toString(), inline: true },
                            { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
                        )
                        .setColor( 0x2ECC71 );
                    interaction.reply({ embeds: [embed] });

                    // Schedule unmute after the duration
                    setTimeout(async () => {
                        // Ensure the user still has the mute role before removing it
                        if (member.roles.cache.has(muteRoleId)) {
                            await member.roles.remove(muteRoleId);
                            const unmuteEmbed = new EmbedBuilder()
                                .setTitle(`${user.displayName} unmuted`)
                                .setDescription(`Could not muted: <@${member.id}>`)
                                .addFields(
                                    { name: 'Reason', value: reason, inline: true},
                                    { name: 'Duration', value: `${duration} minute(s)`, inline: true},
                                    { name: 'Level', value: level.toString(), inline: true },
                                    { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
                                )
                                .setColor( 0x008080 );
                            interaction.followUp({ embeds: [unmuteEmbed] }); // Notify in the same channel
                        }
                    }, durationMs);
                })
                .catch(err => {
                    interaction.reply('Unable to mute the user');
                    console.error(err);
                });
        }
    },    

    // * Working
    unmute: {
        execute: async (interaction) => {
            const serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Unmute Was Run by <@${user.id}>`, 'low');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply('You do not have permission to manage roles');
            }
    
            const member = interaction.guild.members.cache.get(interaction.options.getUser('user').id);
            if (!member) return interaction.reply('Please mention a user to unmute');
    
            // Fetch the server's mute roles from the database
            const server = await Server.findOne({ where: { serverId: interaction.guild.id } });
            if (!server) return interaction.reply('Server settings not found');
    
            // Mute role IDs
            const level1MuteRoleId = server.mute_role_level_1_id;
            const level2MuteRoleId = server.mute_role_level_2_id;
    
            if (!level1MuteRoleId && !level2MuteRoleId) return interaction.reply('No mute roles found for this server');
    
            // Remove both mute roles if the user has any of them
            let unmuted = false;
            if (level1MuteRoleId && member.roles.cache.has(level1MuteRoleId)) {
                await member.roles.remove(level1MuteRoleId);
                unmuted = true;
            }
            if (level2MuteRoleId && member.roles.cache.has(level2MuteRoleId)) {
                await member.roles.remove(level2MuteRoleId);
                unmuted = true;
            }
    
            if (unmuted) {
                const embed = createEmbed(`${user.displayName} Unmuted`, `<@${member.id}> was unmuted from the server`, 0x008080);
                interaction.reply({ embeds: [embed] });
            } else {
                interaction.reply('User is not currently muted');
            }
        }
    },    

    // //
};
