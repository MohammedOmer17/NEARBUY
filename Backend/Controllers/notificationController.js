const notificationService = require("../services/notificationService");

const getNotifications = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await notificationService.getUserNotifications(req.user._id, req.userRole, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch notifications",
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadNotificationCount(req.user._id, req.userRole);

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch unread notification count",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(
      req.params.notificationId,
      req.user._id,
      req.userRole
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update notification",
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user._id, req.userRole);

    return res.status(200).json({
      success: true,
      data: {
        matchedCount: result?.matchedCount || 0,
        modifiedCount: result?.modifiedCount || 0,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to mark notifications as read",
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.deleteNotification(
      req.params.notificationId,
      req.user._id,
      req.userRole
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to delete notification",
    });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    const result = await notificationService.deleteAllUserNotifications(req.user._id, req.userRole);

    return res.status(200).json({
      success: true,
      data: {
        deletedCount: result?.deletedCount || 0,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to delete notifications",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
};
