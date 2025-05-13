// server/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Método para hash de senha antes de salvar
userSchema.pre('save', async function (next) {
    // Somente hash a senha se for nova ou modificada
    if (!this.isModified('password')) return next();

    try {
        // Gerar um salt e fazer hash da senha
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Método para gerar token JWT
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        process.env.JWT_SECRET || 'seu-segredo-jwt-super-secreto',
        { expiresIn: '1d' }
    );
    return token;
};

export const User = mongoose.model('User', userSchema);
export default User;