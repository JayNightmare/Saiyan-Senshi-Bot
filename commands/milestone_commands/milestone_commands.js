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
    checkAndGrantMilestoneRoles
} = require('../utils');

module.exports = {
    // // 
    
    setupMilestone: {
        execute: async (interaction) => {
            // Check for Manage Roles permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }

            // Get input options
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');
            const guildId = interaction.guild.id;
            const members = await interaction.guild.members.fetch();

            let userData = await getUserData(guildId, userId);
            for (const member of members.values()) {
                const userLevel = userData.level; // Retrieve the member's level from your leveling system
                await checkAndGrantMilestoneRoles(member, interaction.guild.id, userLevel);
            }

            try {
                // Check if a milestone for this level already exists in the database
                const existingMilestone = await MilestoneLevel.findOne({
                    where: {
                        guildId,
                        level
                    }
                });

                if (existingMilestone) { return interaction.reply({ content: `A milestone for level ${level} already exists.`, ephemeral: true }); }

                // Save milestone level to the database
                await MilestoneLevel.create({
                    guildId,
                    level,
                    reward: role.id
                });

                return interaction.reply({ content: `Milestone set! When a user reaches level ${level}, they will be granted the "${role.name}" role.` });
            } catch (error) { return interaction.reply({ content: 'An error occurred while setting the milestone. Please try again later.', ephemeral: true }); }
        }
    },

    // //
}