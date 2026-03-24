const userService = require('../services/userService');

exports.getUsers = async (req, res, next) => {
    try {
        const keyword = req.query.search;
        const users = await userService.getUsers(req.user._id, keyword);
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.getRoomMessages = async (req, res, next) => {
    try {
        const { room } = req.params;
        const messages = await userService.getRoomMessages(room, 50); // limit 50 messages
        res.json(messages);
    } catch (error) {
        next(error);
    }
};

const User = require('../models/User');

exports.uploadProfilePic = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const fileUrl = `/uploads/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(req.user._id, { profilePic: fileUrl }, { new: true }).select('-password');
        res.json(user);
    } catch (error) {
        next(error);
    }
};
