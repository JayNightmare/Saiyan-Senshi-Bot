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
            // Check for Manage Roles permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
            }

            // Get input options
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');
            const guildId = interaction.guild.id;
            const members = await interaction.guild.members.fetch();

            for (const member of members.values()) {
                // Fetch user data for each member
                let userData = await getUserData(guildId, member.id);
                
                if (userData) {
                    const userLevel = userData.level; // Retrieve the member's level from your leveling system
                    await giveRoleToUserIfNoneArrange(member, interaction.guild.id, userLevel);
                }
            }

            try {
                // Check if a milestone for this level already exists in the database
                const existingMilestone = await MilestoneLevel.findAll({
                    where: {
                        guildId,
                        level,
                        reward: role.id
                    }
                });

                if (existingMilestone) { return interaction.reply({ content: `A milestone for level ${level} already exists.`, ephemeral: true }); }

                // Save milestone level to the database
                await MilestoneLevel.create({
                    guildId,
                    level,
                    reward: role.id
                });

                const embed = new EmbedBuilder()
                    .setColor(0x008080)
                    .setTitle('Milestone Set')
                    .setDescription(`Milestone has been set!`)
                    .addFields(
                        { name: 'Level', value: level },
                        { name: 'Reward Role', value: `<@&${role.id}>` }
                    )
                    .setTimestamp();
                    
                return interaction.reply({ embeds: embed });
            } catch (error) { return interaction.reply({ content: 'An error occurred while setting the milestone. Please try again later.', ephemeral: true }); }
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
    }

    // //
}