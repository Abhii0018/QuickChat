const User = require('../models/User');
const Message = require('../models/Message');

exports.getUsers = async (userId, searchKeyword) => {
    let query = { _id: { $ne: userId } };
    
    if (searchKeyword) {
        query.$or = [
            { username: { $regex: searchKeyword, $options: 'i' } },
            { email: { $regex: searchKeyword, $options: 'i' } },
        ];
    }

    // Using lean() to return pure JSON for better performance
    return await User.find(query).select('-password').lean();
};

exports.getRoomMessages = async (room, limit = 50) => {
    const messages = await Message.find({ room })
        .populate('sender', 'username email isOnline')
        .sort({ createdAt: -1 }) // use the index we created
        .limit(limit)
        .lean();
    
    return messages.reverse();
};
