const Message = require('../models/Message');

exports.saveMessage = async ({ senderId, room, text, fileUrl, fileType }) => {
    const message = await Message.create({
        sender: senderId,
        room,
        text,
        fileUrl,
        fileType
    });

    return await message.populate('sender', 'username email');
};
