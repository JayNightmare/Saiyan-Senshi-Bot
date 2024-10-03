const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { ReactionRole } = require('../../models/models.js'); // Import the Sequelize User model
const { logEvent } = require('../../events/logEvents.js');

async function saveReactionRole(guildId, messageId, emoji, roleId) {
    await ReactionRole.create({
        guildId,
        messageId,
        emoji,
        roleId,
    });
}

async function loadReactionRoles() {
    try {
        // Fetch all reaction roles from the database
        const allReactionRoles = await ReactionRole.findAll(); // Adjust this based on your model name

        // Iterate through the results and populate the in-memory configuration
        allReactionRoles.forEach(({ serverId, messageId, emoji, roleId }) => {
            if (!reactionRoleConfigurations.has(serverId)) {
                reactionRoleConfigurations.set(serverId, []);
            }

            // Add to the server-specific array in the configuration
            reactionRoleConfigurations.get(serverId).push({
                messageId,
                emoji,
                roleId
            });
        });

        console.log('Successfully loaded all reaction roles from the database.');
    } catch (error) {
        console.error('Error loading reaction roles from the database:', error);
    }
}

module.exports = {
    // Reaction Roles
    saveReactionRole,
    loadReactionRoles
};