const { MessageEmbed } = require('discord.js');
const { MilestoneLevel, Server, User } = require('../models/models.js');

function createEmbed(title, description, color) {
    return new MessageEmbed()
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

    // Server Data
    getServerData
};