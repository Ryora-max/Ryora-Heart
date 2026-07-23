import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/actions/auth";
import {
  getMoods,
  addMood,
  getActivities,
  createActivity,
  toggleActivity,
  updateActivity,
  deleteActivity,
  getGallery,
  addPhoto,
  deletePhoto,
  getCalendarEvents,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getLetters,
  createLetter,
  deleteLetter,
  getNotifications,
  markNotificationsAsRead,
  getPartnerId,
  updatePresence,
  getPresence,
  addStatusUpdate,
  getStatusUpdates,
  sendHug,
  getHugs,
  updateLoveMeter,
  getLoveMeter,
  addLocation,
  getLocations,
  getUserExtra,
  setUserExtra,
  getAchievements,
} from "@/app/actions/db";
import { updateProfile, updateSettings, getUserSettings } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, ...params } = body;

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const pairId = session.user.pair_id || "";

    switch (action) {
      case "getMoods":
        return NextResponse.json(await getMoods(pairId));
      case "addMood":
        return NextResponse.json(await addMood(userId, pairId, params.mood, params.note));
      case "getActivities":
        return NextResponse.json(await getActivities(pairId));
      case "createActivity":
        return NextResponse.json(await createActivity(userId, pairId, params.title, params.type, params.date, params.description));
      case "toggleActivity":
        return NextResponse.json(await toggleActivity(userId, pairId, params.activityId, params.completed));
      case "updateActivity":
        return NextResponse.json(await updateActivity(userId, pairId, params.activityId, params.title, params.description));
      case "deleteActivity":
        return NextResponse.json(await deleteActivity(userId, pairId, params.activityId));
      case "getGallery":
        return NextResponse.json(await getGallery(pairId));
      case "addPhoto":
        return NextResponse.json(await addPhoto(userId, pairId, params.url, params.caption));
      case "deletePhoto":
        return NextResponse.json(await deletePhoto(userId, pairId, params.photoId));
      case "getCalendarEvents":
        return NextResponse.json(await getCalendarEvents(pairId));
      case "addCalendarEvent":
        return NextResponse.json(await addCalendarEvent(userId, pairId, params.title, params.date, params.type, params.description));
      case "updateCalendarEvent":
        return NextResponse.json(await updateCalendarEvent(userId, pairId, params.eventId, params.data));
      case "deleteCalendarEvent":
        return NextResponse.json({ success: await deleteCalendarEvent(userId, pairId, params.eventId) });
      case "getLetters":
        return NextResponse.json(await getLetters(pairId));
      case "createLetter":
        return NextResponse.json(await createLetter(userId, pairId, params.letter));
      case "deleteLetter":
        return NextResponse.json({ success: await deleteLetter(userId, pairId, params.letterId) });
      case "getNotifications":
        return NextResponse.json(await getNotifications(userId));
      case "markNotificationsAsRead":
        return NextResponse.json(await markNotificationsAsRead(userId));
      case "getPartnerId":
        return NextResponse.json({ partnerId: await getPartnerId(userId, pairId) });
      case "updatePresence":
        await updatePresence(userId, pairId, params.status);
        return NextResponse.json({ success: true });
      case "getPresence":
        return NextResponse.json(await getPresence(pairId));
      case "addStatusUpdate":
        return NextResponse.json(await addStatusUpdate(userId, pairId, params.message, params.emoji));
      case "getStatusUpdates":
        return NextResponse.json(await getStatusUpdates(pairId));
      case "sendHug":
        return NextResponse.json(await sendHug(userId, pairId, params.receiverId, params.message));
      case "getHugs":
        return NextResponse.json(await getHugs(pairId));
      case "updateLoveMeter":
        return NextResponse.json(await updateLoveMeter(userId, pairId, params.percentage));
      case "getLoveMeter":
        return NextResponse.json(await getLoveMeter(pairId));
      case "addLocation":
        return NextResponse.json(await addLocation(userId, pairId, params.place, params.note));
      case "getLocations":
        return NextResponse.json(await getLocations(pairId));
      case "updateProfile":
        await updateProfile(userId, params.data);
        return NextResponse.json({ success: true });
      case "updateSettings":
        await updateSettings(userId, params.data);
        return NextResponse.json({ success: true });
      case "getUserSettings":
        return NextResponse.json(await getUserSettings(userId));
      case "getUserExtra":
        return NextResponse.json(await getUserExtra(userId, params.key));
      case "setUserExtra":
        return NextResponse.json(await setUserExtra(userId, pairId, params.key, params.value));
      case "getAchievements":
        return NextResponse.json(await getAchievements(pairId));
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
