const { User } = require('../../models/models.js');

// Get specific user data
async function getUserData(guildId, userId) {
    const userData = await User.findOne({ where: { guildId, userId }});
    return userData;
}

// Get all user data
async function getUserCount(guildId) {
    const userCount = await User.count({ where: { guildId } });
    return userCount;
}

// Set User Bio
async function updateUserBio(guildId, userId, bio) {
    const setBio = await User.findOne({ where: { guildId, userId } });
    
    if (setBio) { await User.update({ bio }, { where: { guildId, userId } }); } 
    else { await User.create({ guildId, userId, bio }); }
    return bio;
}

module.exports = {
    // User Data
    getUserData,
    getUserCount,
    updateUserBio,
};