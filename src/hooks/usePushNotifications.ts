"use client";

import { useState, useCallback, useEffect } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined") return "default";
    if ("Notification" in window) return Notification.permission;
    return "default";
  });
  const [isSupported, setIsSupported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return "Notification" in window && "serviceWorker" in navigator;
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
