const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// User Model: Storing user information (for leveling and other features)
const User = sequelize.define('User', {
    userId: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    warnings: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
});

// Punishment Model: Logging bans, warnings, and timeouts
const Punishment = sequelize.define('Punishment', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    type: {
        type: DataTypes.ENUM('ban', 'warn', 'timeout'),
        allowNull: false,
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

// Define the Server model
const Server = sequelize.define('Server', {
    serverId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    serverName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    textChannelId: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    loggingChannelId: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    welcomeChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rankUpChannelId: {
        type: DataTypes.STRING,
        allowNull: true
    },    
    logLevel: {
        type: DataTypes.STRING, // This will store "low", "medium", or "high"
        defaultValue: 'low' // Default to low level logging
    },
    mute_role_level_1_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mute_role_level_2_id: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

const MilestoneLevel = sequelize.define('MilestoneLevel', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    reward: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    // Composite unique constraint
    uniqueKeys: {
        actions_unique: {
            fields: ['guildId', 'level']
        }
    }
});

const ReactionRole = sequelize.define('ReactionRoles', {
    guildId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emoji: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    roleId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Syncing the models with the database
(async () => {
    try {
        await User.sync(); // Create the User table if it doesn't exist
        await Punishment.sync(); // Create the Punishment table if it doesn't exist
        await Server.sync(); // Create the Server table if it doesn't exist
        await MilestoneLevel.sync(); // Create the MilestoneLevel table if it doesn't exist
        await ReactionRole.sync(); // Create the ReactionRole table if it doesn't exist
        console.log('Database models synced successfully.');
    } catch (error) {
        console.error('Unable to sync models with the database:', error);
    }
})();

module.exports = { User, Punishment, Server, MilestoneLevel, ReactionRole };
