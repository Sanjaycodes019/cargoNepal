const Notification = require('../models/NotificationModel');

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id
    }).sort({ createdAt: -1 }).limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };

