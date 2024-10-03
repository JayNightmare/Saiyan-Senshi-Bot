const { EmbedBuilder } = require('discord.js');
const { MilestoneLevel, Server } = require('../../models/models.js');
const { Op } = require('sequelize');

async function checkAndGrantMilestoneRoles(member, guildId, level, message) {
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

        // Check if there's a specific rank-up channel set
        const serverConfig = await Server.findOne({ where: { serverId: guildId } });
        const rankUpChannelId = serverConfig?.rankUpChannelId;

        // Fetch the channel to send rank-up messages
        const rankUpChannel = rankUpChannelId
            ? member.guild.channels.cache.get(rankUpChannelId) // Use the configured channel if set
            : message.channel; // Use the message channel otherwise

        // Ensure that `rankUpChannel` is a valid channel object
        if (!rankUpChannel?.isTextBased()) {
            console.error('Invalid channel for rank-up messages.');
            return;
        }

        let roleGranted = false;

        // Go through each milestone and check if the user has the role
        
        // if milestone role exists, go through for loop
        if (milestones.length > 0) {
            for (const milestone of milestones) {
                const role = member.guild.roles.cache.get(milestone.reward);
                if (!role) {
                    continue;
                }

                // Check if the member already has the role
                if (!member.roles.cache.has(role.id)) {
                    // Add the role if missing
                    await member.roles.add(role);

                    if (rankUpChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🎉 **Transformation Reached!** 🎉')
                            .setDescription(`
### <@${member.user.id}> has been granted <@&${role.id}> for reaching Level ${milestone.level}!

**Keep training to reach the next transformation!**
`)
                            .setImage(`https://tenor.com/en-GB/view/sailor-moon-anime-moon-prism-power-moon-prism-power-makeup-serena-gif-15851654.gif`)
                            .setColor(0x008080);

                        rankUpChannel.send({ embeds: [embed] });
                    }
                } else {
                    if (rankUpChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🎉 **Transformation Reached!** 🎉')
                            .setDescription(`
**<@${member.user.id}> has been granted <@&${role.id}> for reaching Level ${milestone.level}!**

Keep training to reach the next transformation!
`)
                            .setImage(`https://tenor.com/en-GB/view/sailor-moon-anime-moon-prism-power-moon-prism-power-makeup-serena-gif-15851654.gif`)
                            .setColor(0x008080);

                        rankUpChannel.send({ embeds: [embed] });
                    }
                }
            }
        } else {
            // Send a message even if no milestone role was granted
            if (!roleGranted && rankUpChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Keep Training!')
                    .setDescription(`Great job, <@${member.user.id}>! You're currently at level ${level}. Keep training to reach the next transformation!`)
                    .setColor(0xFFD700);
    
                rankUpChannel.send({ embeds: [embed] });
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

        // Get the user's highest role position
        const memberHighestRolePosition = member.roles.highest.position;

        // Go through each milestone and check if the user has the role
        for (const milestone of milestones) {
            const role = member.guild.roles.cache.get(milestone.reward);
            if (!role) continue;

            // Check if the role is lower than or equal to the user's highest role
            if (role.position <= memberHighestRolePosition) {
                console.log(`Skipping role ${role.name} as the user already has a higher or equal role.`);
                continue;
            }

            // If the user does not have the milestone role, add it
            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                console.log(`Added role ${role.name} to user ${member.user.username}`);
            }
        }
    } catch (err) {
        console.error(`Error checking and granting milestone roles for user ${member.user.username}:`, err);
    }
}

async function isMilestoneLevel(guildId, level) {
    const milestone = await MilestoneLevel.findOne({ where: { guildId, level } });
    return milestone !== null;
}

module.exports = {
    // Milestone Roles
    checkAndGrantMilestoneRoles,
    giveRoleToUserIfNoneArrange,

    // Milestone Levels
    isMilestoneLevel
};