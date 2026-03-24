const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.registerUser = async ({ username, email, password }) => {
    // Check if user exists (lean is slightly faster for read-only)
    const userExists = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (userExists) {
        throw new Error('User already exists');
    }

    const user = await User.create({ username, email, password });
    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
    };
};

exports.loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
        throw new Error('Invalid email or password');
    }

    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
    };
};

exports.getUserById = async (id) => {
    const user = await User.findById(id).lean();
    if (!user) throw new Error('User not found');
    return user;
};
