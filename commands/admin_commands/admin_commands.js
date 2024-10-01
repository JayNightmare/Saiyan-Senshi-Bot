const { createEmbed } = require('../utils');

module.exports = {
    ban: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to ban.');
    
            member.ban()
                .then(() => {
                    const embed = createEmbed('User Banned', `${member.user.tag} was banned from the server.`, 'RED');
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to ban the user.');
                    console.error(err);
                });
        }
    },

    unban: {
        execute: async (interaction, args) => {
            const userId = args[0];
            if (!userId) return interaction.reply('Please provide a user ID to unban.');

            interaction.guild.bans.fetch()
                .then(bans => {
                    const ban = bans.get(userId);
                    if (!ban) return interaction.reply('User is not banned.');

                    interaction.guild.members.unban(userId)
                        .then(() => {
                            const embed = createEmbed('User Unbanned', `<@${userId}> was unbanned from the server.`, 'GREEN');
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.reply('Unable to unban the user.');
                            console.error(err);
                        });
                })
                .catch(err => {
                    interaction.reply('Unable to fetch bans.');
                    console.error(err);
                });
        }
    },

    kick: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to kick.');

            member.kick()
                .then(() => {
                    const embed = createEmbed('User Kicked', `${member.user.tag} was kicked from the server.`, 'RED');
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to kick the user.');
                    console.error(err);
                });
        }
    },

    warn: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return createEmbed('Please mention a user to warn.');
    
            member.warn()
                .then(() => {
                    const embed = createEmbed('User Warned', `${member.user.tag} was warned in the server.`, 'RED');
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to warn the user.');
                    console.error(err);
                });
        }
    },

    // Remove warning from user
    removeWarning: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to remove a warning.');
            member.removeWarning()
                .then(() => {
                    const embed = createEmbed('Warning Removed', `${member.user.tag}'s warning was removed.`);
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to remove the warning.');
                    console.error(err);
                });
        }
    },


    timeout: {
        execute: async (interaction, args) => {
            // get mentioned user from slash command
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to time out.');
            
            // get duration from slash command
            const duration = parseInt(interaction.options.get('duration').value);
            if (!duration) return interaction.reply('Please provide a duration in minutes.');
            if (duration < 1) return interaction.reply('Duration must be at least 1 minute.');
    
            member.timeout()
                .then(() => {
                    const embed = createEmbed(`Successfully timed out ${member.user.tag} for ${duration} minutes.`);
                    interaction.reply({ embeds: [embed] });
    
                })
                // Clear the timeout after the specified duration
                .catch(err => {
                    const embed = createEmbed('Unable to timeout the user.');
                    interaction.reply({ embeds: [embed] });
                    console.error(err);
            });
        }
    },

    removetimeout: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to remove the timeout.');
            member.roles.remove('YOUR_TIMEOUT_ROLE_ID')
                .then(() => {
                    const embed = createEmbed('User Timeout Removed', `${member.user.tag}'s timeout was removed.`);
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to remove the timeout.');
                    console.error(err);
                });
            }
    },

    mute: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to mute.');
            member.roles.add('YOUR_MUTED_ROLE_ID')
                .then(() => {
                    const embed = createEmbed('User Muted', `${member.user.tag} was muted in the server.`);
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to mute the user.');
                    console.error(err);
                });
        }
    },

    unmute: {
        execute: async (interaction, args) => {
            const member = interaction.guild.members.cache.get(interaction.options.get('user').value);
            if (!member) return interaction.reply('Please mention a user to unmute.');
            member.roles.remove('YOUR_MUTED_ROLE_ID')
                .then(() => {
                    const embed = createEmbed('User Unmuted', `${member.user.tag} was unmuted from the server.`);
                    interaction.reply({ embeds: [embed] });
                })
                .catch(err => {
                    interaction.reply('Unable to unmute the user.');
                    console.error(err);
                });
        }
    },

    // //

    // Setup mute role
    setupMuteRole: {
        execute: async (interaction, args) => {
            if (!interaction.member.hasPermission('MANAGE_ROLES')) return interaction.reply('You do not have permission to manage roles.');
    
            const role = interaction.guild.roles.cache.find(r => r.name === 'Muted');
            if (!role) {
                interaction.guild.roles.create({ data: { name: 'Muted', permissions: [] } })
                    .then(role => {
                        interaction.reply(`Created new role: ${role.name}`);
                    })
                    .catch(err => {
                        interaction.reply('Failed to create new role.');
                        console.error(err);
                    });
            } else {
                interaction.reply(`Role "${role.name}" already exists.`);
            }
        }
    }   
};
