const express = require("express");
const { authAnyUser } = require("../Middlewares/authMiddleware");
const {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../Controllers/notificationController");

const router = express.Router();

router.get("/", authAnyUser, getNotifications);
router.get("/unread-count", authAnyUser, getUnreadNotificationCount);
router.patch("/:notificationId/read", authAnyUser, markNotificationAsRead);
router.patch("/read-all", authAnyUser, markAllNotificationsAsRead);
router.delete("/:notificationId", authAnyUser, deleteNotification);
router.delete("/", authAnyUser, deleteAllNotifications);

module.exports = router;
