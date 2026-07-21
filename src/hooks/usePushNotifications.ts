"use client";

import { useState } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useState(() => {
    setIsSupported("Notification" in window && "serviceWorker" in navigator);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  });

  const requestPermission = async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const sendNotification = (title: string, body: string, icon?: string) => {
    if (permission !== "granted") return;

    const registration = navigator.serviceWorker.ready;
    registration.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: icon || "/icon-192.png",
        badge: "/icon-192.png",
        tag: "ryora-notification",
      });
    });
  };

  return { permission, isSupported, requestPermission, sendNotification };
}
