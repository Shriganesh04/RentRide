const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
        address: {
        type: String,
        default: null
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        darkMode: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            default: 'en'
        },
        twoFactorAuth: {
            type: Boolean,
            default: false
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    // True when the user has an unpaid fine and no deposit was available to
    // cover it. Blocks new bookings only — browsing, login, and viewing
    // existing bookings/history remain unaffected.
    bookingBlocked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving (skip if Firebase user)
// Hash password before saving (skip if Firebase user)
UserSchema.pre('save', async function () {
    // If password is not modified, skip hashing
    if (!this.isModified('password')) {
        return;
    }

    // Skip hashing for Firebase placeholder passwords
    if (this.password.startsWith('firebase_')) {
        return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // Firebase users cannot use password login
    if (this.password.startsWith('firebase_')) {
        return false;
    }

    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash a password reset token.
// Returns the RAW (unhashed) token to email to the user — only the
// SHA-256 hash is stored in the DB, so a database leak alone can't
// be used to reset anyone's password.
UserSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);