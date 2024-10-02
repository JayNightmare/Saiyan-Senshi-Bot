const { EmbedBuilder } = require('discord.js');
const { MilestoneLevel, Server, User } = require('../models/models.js');
const { Op } = require('sequelize');

function createEmbed(title, description, color) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);
}

// //

// Check if milestone level for server is available
async function isMilestoneLevel(guildId, level) {
    const milestone = await MilestoneLevel.findOne({ where: { guildId, level } });
    return milestone !== null;
}

// //

// Mange Roles for users who have reached a new level
async function manageRoles(member, level, guild, message) {
    // Example: Assign a role based on the level
    const roleName = `Level ${level}`;
    const role = guild.roles.cache.find(r => r.name === roleName);

    if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        message.channel.send(`You have been given the ${roleName} role!`);
    }
}

// //

// Get specific user data
async function getUserData(guildId, id) {
    const userData = await User.findOne({where: { guildId, id }});
    return userData;
}

// Get all user data
async function getUserCount(guildId) {
    const userCount = await User.count({ where: { guildId } });
    return userCount;
}

// Set User Bio
async function updateUserBio(guildId, id, bio) {
    const setBio = await User.findOne({ where: { guildId, id, bio } });
    if (setBio) {
        await User.update({ bio }, { where: { guildId, id } });
    } else {
        await User.create({ guildId, id, bio });
    }
    return bio;
}

// //

// Get all Server data
async function getServerData(guildId) {
    const serverData = await Server.findOne({where: { guildId }});
    return serverData;
}

// //

async function checkAndGrantMilestoneRoles(member, guildId, level) {
    try {
        // Fetch all milestone levels up to the user's current level for this guild
        const milestones = await MilestoneLevel.findAll({
            where: {
                guildId: guildId,
                level: {
                    [Op.lte]: level // Sequelize operator for less than or equal to
                }
            },
            order: [['level', 'ASC']] // Order milestones by level in ascending order
        });

        // Go through each milestone and check if the user has the role
        for (const milestone of milestones) {
            const role = member.guild.roles.cache.get(milestone.reward);
            if (!role) {
                console.log(`Role not found for ID ${milestone.reward}`);
                continue;
            }

            // Check if the member already has the role
            if (!member.roles.cache.has(role.id)) {
                // Add the role if missing
                await member.roles.add(role);
                console.log(`Added missing milestone role ${role.name} to user ${member.user.username}.`);

                // Optionally, send a message to the channel
                const channel = member.guild.channels.cache.find(ch => ch.name === 'general'); // Change to your preferred channel
                if (channel) {
                    channel.send(`🎉 <@${member.user.id}> has been granted <@&${role.id}> for reaching level ${milestone.level}! 🎉`);
                }
            }
        }
    } catch (err) {
        console.error(`Error checking and granting milestone roles for user ${member.user.username}:`, err);
    }
}

async function giveRoleToUserIfNoneArrange(member, guildId, level) {
    try {
        // Fetch all milestone levels up to the user's current level for this guild
        const milestones = await MilestoneLevel.findAll({
            where: {
                guildId: guildId,
                level: {
                    [Op.lte]: level // Sequelize operator for less than or equal to
                }
            },
            order: [['level', 'ASC']] // Order milestones by level in ascending order
        });

        // Go through each milestone and check if the user has the role
        for (const milestone of milestones) {
            const role = member.guild.roles.cache.get(milestone.reward);
            if (!role) {
                continue;
            }

            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
            }
        }
    } catch (err) {
        console.error(`Error checking and granting milestone roles for user ${member.user.username}:`, err);
    }
}

// //

module.exports = {
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
    getServerData,

    // Milestone Roles
    checkAndGrantMilestoneRoles,
    giveRoleToUserIfNoneArrange
};