const { EmbedBuilder } = require("discord.js");
require('dotenv').config();

module.exports = {
    help_menu_selected: {
        execute: async (interaction) => {
            try {
                let embed;
                switch (interaction.values[0]) {
                    case "admin_commands":
                        embed = new EmbedBuilder()
                            .setColor(0x3498db)
                            .setTitle("Admin Commands").setDescription(`
                            • List of admin commands
                            `);
                        break;

                    case "community_commands":
                        embed = new EmbedBuilder()
                            .setColor(0x3498db)
                            .setTitle("Community Commands").setDescription(`
                            • List of community commands
                            `);
                        break;

                    case "configuration_commands":
                        embed = new EmbedBuilder()
                            .setColor(0x3498db)
                            .setTitle("Configuration Commands").setDescription(`
                            • List of configuration commands
                            `);
                        break;

                    case "owner_commands":
                        // Check if the user is the bot owner
                        if (interaction.user.id !== process.env.OWNER
                        ) {
                            return interaction.reply({
                                content:
                                    "You do not have permission to view this section.",
                                ephemeral: true,
                            });
                        }
                        embed = new EmbedBuilder()
                            .setColor(0xff0000)
                            .setTitle("Owner Commands").setDescription(`
                            • List of owner commands
                            `);
                        break;

                    case "command_help":
                        embed = new EmbedBuilder()
                            .setColor(0xffa500)
                            .setTitle("Help With Commands").setDescription(`
                                All commands use slash commands. If you want a new command or feature, please contact the [bot owner](https://discord.com/invite/W3bZxykvAX).
                            `);
                        break;

                    default:
                        return;
                }

                // Validate and send the embed
                if (
                    embed?.data &&
                    (embed.data.title || embed.data.description)
                ) {
                    await interaction.reply({
                        embeds: [embed],
                        ephemeral: true,
                    }); // Use update to edit the original message
                } else {
                    console.error(
                        "Attempted to send an embed with missing or invalid fields."
                    );
                    await interaction.reply({
                        content:
                            "There was an error generating the command list. Please try again later.",
                        ephemeral: true,
                    });
                }
            } catch (err) {
                return;
            }
        },
    },
};
