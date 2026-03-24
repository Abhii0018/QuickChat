// @desc    Upload a file
// @route   POST /api/upload
// @access  Private
const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Generate file URL (Assuming static hosting in /public)
        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            fileType: req.file.mimetype,
            fileName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    uploadFile
};
