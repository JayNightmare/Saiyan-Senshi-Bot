const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { Server, User, MilestoneLevel } = require('../../models/models.js'); // Import the Sequelize User model
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

    // Server Data
    getServerData,
    checkAndGrantMilestoneRoles,
    giveRoleToUserIfNoneArrange
} = require('../utils');

module.exports = {
    // // 

    setupMilestone: {
        execute: async (interaction) => {
            try {
                // Check for Manage Roles permission
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                    return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
                }
    
                // Get input options
                const level = interaction.options.getInteger('level');
                const role = interaction.options.getRole('role');
                const guildId = interaction.guild.id;
                console.log(`Setting up milestone for guild ${guildId}, level ${level}, role ${role.id}`);
    
                // Fetch all members in the guild
                const members = await interaction.guild.members.fetch();
                for (const member of members.values()) {
                    // Fetch user data for each member
                    let userData = await getUserData(guildId, member.id);
                    
                    if (userData) {
                        const userLevel = userData.level; // Retrieve the member's level from your leveling system
                        await giveRoleToUserIfNoneArrange(member, interaction.guild.id, userLevel);
                    }
                }
    
                // Check if a milestone for this level already exists in the database
                console.log('Checking if milestone already exists...');
                const existingMilestone = await MilestoneLevel.findOne({
                    where: {
                        guildId,
                        level,
                    }
                });
    
                if (existingMilestone) { 
                    console.log('Milestone already exists for this level.');
                    return interaction.reply({ content: `A milestone for level ${level} already exists.`, ephemeral: true });
                }
    
                // Save milestone level to the database
                console.log('Creating new milestone...');
                await MilestoneLevel.create({
                    guildId,
                    level,
                    reward: role.id
                });
    
                // Create and send the embed
                console.log('Milestone successfully created, preparing embed...');
                const embed = new EmbedBuilder()
                    .setColor(0x008080)
                    .setTitle('Milestone Set')
                    .setDescription(`Milestone has been set!`)
                    .addFields(
                        { name: 'Level', value: level.toString() },
                        { name: 'Reward Role', value: `<@&${role.id}>` }
                    )
                    .setTimestamp();
                    
                return interaction.reply({ embeds: [embed] });
            } catch (error) { 
                // Log the full error for debugging
                console.error('Error in setupMilestone:', error);
                return interaction.reply({ content: 'An error occurred while setting the milestone. Please try again later.', ephemeral: true });
            }
        }
    },    

    // Remove Milestone level 
    removeMilestone: {
        execute: async (interaction) => {
            // Check for Manage Roles permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }

            // Get input options
            const level = interaction.options.getInteger('level');
            const guildId = interaction.guild.id;

            try {
                // Check if a milestone for this level exists in the database
                const existingMilestone = await MilestoneLevel.findOne({
                    where: {
                        guildId,
                        level
                    }
                });

                if (!existingMilestone) { return interaction.reply({ content: `No milestone for level ${level} exists.`, ephemeral: true }); }

                // Remove milestone level from the database
                await existingMilestone.destroy();

                const embed = new EmbedBuilder()
                    .setColor(0x008080)
                    .setTitle('Milestone Removed')
                    .setDescription(`Milestone for level ${level} has been removed.`)
                    .setTimestamp();

                return interaction.reply({ embeds: embed });
            } catch (error) { return interaction.reply({ content: 'An error occurred while removing the milestone. Please try again later.', ephemeral: true }); }
        }
    },

    viewMilestones: {
        execute: async (interaction) => {
            try {
                // Get guildId from the interaction
                const guildId = interaction.guild.id;
    
                // Fetch all milestones for the server
                const milestones = await MilestoneLevel.findAll({
                    where: {
                        guildId: guildId
                    },
                    order: [['level', 'ASC']] // Order by level ascending
                });
    
                // Check if there are any milestones set for the server
                if (milestones.length === 0) {
                    return interaction.reply({ content: 'No milestone levels have been set for this server.', ephemeral: true });
                }
    
                // Create a list of milestone levels and their corresponding roles
                const milestoneFields = milestones.map((milestone, index) => ({
                    name: `Milestone ${index + 1}`,
                    value: `**Level**: ${milestone.level}\n**Role**: <@&${milestone.reward}>`,
                    inline: true
                }));
    
                // Create an embed to display the milestones
                const milestoneEmbed = new EmbedBuilder()
                    .setColor(0x008080) // Set your preferred color
                    .setTitle('Server Milestone Levels')
                    .setDescription('Here are all the milestone levels set for this server:')
                    .addFields(milestoneFields)
                    .setFooter({ text: `Requested by ${interaction.user.tag}` })
                    .setTimestamp();
    
                // Send the embed with milestone details
                return interaction.reply({ embeds: [milestoneEmbed] });
            } catch (error) {
                console.error('Failed to fetch milestone levels:', error);
                return interaction.reply({ content: 'An error occurred while fetching milestone levels. Please try again later.', ephemeral: true });
            }
        }
    }
    
    // //
}