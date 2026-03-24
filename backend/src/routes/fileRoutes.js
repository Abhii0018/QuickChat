const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

router.post('/upload', protect, upload.single('file'), uploadFile);

module.exports = router;
