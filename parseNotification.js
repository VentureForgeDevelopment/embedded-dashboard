function parseNotification(notification, type = null) {
  let parsedNotificationData = JSON.parse(notification.data)
  let parsedNotification

  if (type && parsedNotificationData[type]) {
    return parsedNotificationData[type]
  } else if (type && !parsedNotificationData[type]) {
    return null
  } else {
    parsedNotification = {
      id: notification.id,
      type: notification.type,
      title: parsedNotificationData.title,
      body: parsedNotificationData.body,
      priority: parsedNotificationData.priority
        ? parsedNotificationData.priority
        : 0,
      viewed: notification.viewed,
      created_at: notification.created_at,
    }

    return parsedNotification
  }
}

export { parseNotification }
