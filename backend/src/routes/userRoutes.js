const express = require('express');
const router = express.Router();
const { getUsers, getRoomMessages, uploadProfilePic } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').get(protect, getUsers);
router.route('/messages/:room').get(protect, getRoomMessages);
router.route('/profile-pic').post(protect, upload.single('file'), uploadProfilePic);

module.exports = router;
