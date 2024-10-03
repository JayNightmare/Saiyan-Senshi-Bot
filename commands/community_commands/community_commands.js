const { EmbedBuilder, Emoji, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { User } = require('../../models/models.js'); // Import the Sequelize User model
const { logEvent, processLogs } = require('../../events/logEvents.js');

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
    updateUserBio,

    // Server Data
    getServerData
} = require('../utils.js');

module.exports = {
    profile: { 
        execute: async (interaction) => {
            let serverId = interaction.guild.id;
            const user = interaction.user;
            logEvent(serverId, `Profile run by <@${user.id}>`, 'low');
            try {
                // Get the user whose profile to display (or default to the user who ran the command)
                const user = interaction.options.getUser('user') || interaction.user;
                serverId = interaction.guild.id;

                // Fetch user data from the database
                let userData = await User.findOne({ where: { id: user.id, guildId: serverId } });

                // Check if user is in the server
                if (!interaction.guild.members.cache.has(user.id)) {
                    return interaction.reply({ content: 'User is not in this server.', ephemeral: true });
                }

                if (!userData) {
                    // Create default user data if none exists
                    userData = await User.create({
                        id: user.id,
                        username: user.username,
                        guildId: serverId,
                        level: 0,
                        xp: 0,
                        totalMessages: 0,
                    });
                }

                const member = interaction.guild.members.cache.get(user.id) || await interaction.guild.members.fetch(user.id);
                
                // If you have a bio system, use it, otherwise default text
                const bio = userData.bio || "This user hasn't set a bio yet";

                // Display roles the user has (filtering out @everyone)
                const roles = member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => `<@&${role.id}>`)
                    .join(", ") || "No roles";

                // Calculate the progress towards the next level
                const level = userData.level;
                const baseMultiplier = 100;
                const scalingFactor = 1.1;

                const xpNeededForCurrentLevel = Math.floor(level * baseMultiplier * Math.pow(scalingFactor, level));
                const xpNeededForNextLevel = Math.floor((level + 1) * baseMultiplier * Math.pow(scalingFactor, level + 1));

                const xpToNextLevel = xpNeededForNextLevel - xpNeededForCurrentLevel;

                // Create a progress bar based on XP
                const xpProgress = Math.floor((userData.xp / xpToNextLevel) * 10);
                const progressBar = '█'.repeat(xpProgress) + '░'.repeat(10 - xpProgress);

                // Set embed color based on level
                let embedColor;
                if (userData.level >= 50) {
                    embedColor = 0xFFD700; // Gold for level 50+
                } else if (userData.level >= 41) {
                    embedColor = 0xE74C3C; // Ruby Red for level 41-49
                } else if (userData.level >= 31) {
                    embedColor = 0xFF69B4; // Bright Pink for level 31-40
                } else if (userData.level >= 21) {
                    embedColor = 0xF1C40F; // Bright Yellow for level 21-30
                } else if (userData.level >= 16) {
                    embedColor = 0x9B59B6; // Purple for level 16-20
                } else if (userData.level >= 11) {
                    embedColor = 0xE67E22; // Deep Orange for level 11-15
                } else if (userData.level >= 6) {
                    embedColor = 0x2ECC71; // Emerald Green for level 6-10
                } else {
                    embedColor = 0x3498DB; // Sky Blue for level 1-5
                }

                // Create the embed for the user's profile
                const embed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setTitle(`${member.displayName}'s Profile`)
                    .setDescription(bio)
                    .addFields(
                        { name: 'Level', value: `${userData.level}`, inline: true },
                        { name: 'XP', value: `${userData.xp}`, inline: true },
                        { name: 'Progress', value: `${progressBar} (${userData.xp}/${xpToNextLevel} XP)`, inline: true },
                        { name: 'Roles', value: roles, inline: true }
                    )
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({ text: `*Tip: Use the appropriate command to update your bio*` });

                // Send the profile embed to the channel
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Error in profile command:', error);
                interaction.reply("There was an error generating this user's profile. Please try again later.");
            }
        }
    },

    // //

    // Set bio for profile
    setBio: {
        execute: async (interaction) => {
            let serverId = interaction.guild.id;
            let user = interaction.user;
            logEvent(serverId, `Set Bio Was Run by <@${user.id}>`, 'low');
            try {
                const bio = interaction.options.getString('bio');
                user = interaction.user;
                
                serverId = interaction.guild.id;
                const serverConfigsData = await getServerConfigsData(serverId);
                const allowedChannelId = serverConfigsData?.allowedChannel;
                let allowedChannel = interaction.channel;
    
                if (allowedChannelId) {
                    allowedChannel = interaction.guild.channels.cache.get(allowedChannelId) || interaction.channel;
                }
    
                const userId = user.id;

                // Update the bio in the database
                await updateUserBio(serverId, userId, bio);

                // Confirmation message
                const confirmEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle("Bio Updated")
                    .setDescription(`Your bio has been successfully updated!`)
                    .addFields({ name: "Your new bio", value: bio })
                    .setFooter({ text: `Updated by ${user.username}`, iconURL: user.displayAvatarURL() });

                // Send the confirmation message to the user
                await interaction.reply({ embeds: [confirmEmbed] });
            } catch (error) {
                console.error('Error in setbio command (slash): ', error);
                interaction.reply("There was an error updating your bio.");
            }
        }
    },

    // //
    help: {
        execute: async (interaction) => {
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
    }
};
