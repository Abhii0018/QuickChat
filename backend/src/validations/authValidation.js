const { check } = require('express-validator');

exports.registerRules = [
    check('username', 'Username is required and should be valid')
        .notEmpty().trim().isLength({ min: 3 }).escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

exports.loginRules = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
];
