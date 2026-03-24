const authService = require('../services/authService');

exports.registerUser = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error.message === 'User already exists') {
            return res.status(400).json({ message: error.message });
        }
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    try {
        const result = await authService.loginUser(req.body);
        res.json(result);
    } catch (error) {
        if (error.message === 'Invalid email or password') {
            return res.status(401).json({ message: error.message });
        }
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};
