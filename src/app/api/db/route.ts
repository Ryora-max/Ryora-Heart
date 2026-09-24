import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiAuth";
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
  getChatMessages,
  sendChatMessage,
  markChatRead,
  getRinduNotifications,
  sendRindu,
  respondRindu,
} from "@/app/actions/db";
import { updateProfile, updateSettings, getUserSettings } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const pairId = user.pair_id || "";

    // Read actions degrade ke empty data saat backend unreachable — app tetap
    // usable (empty state) alih-alih error boundary di mana-mana. Write
    // actions tetap throw → client retry queue menanganinya.
    const READ_DEFAULTS: Record<string, unknown> = {
      getMoods: [],
      getActivities: [],
      getGallery: [],
      getCalendarEvents: [],
      getLetters: [],
      getNotifications: [],
      getPartnerId: { partnerId: null },
      getPresence: [],
      getStatusUpdates: [],
      getHugs: [],
      getLoveMeter: [],
      getLocations: [],
      getUserSettings: null,
      getUserExtra: null,
      getAchievements: null,
      getChatMessages: [],
      getRinduNotifications: [],
    };

    if (action in READ_DEFAULTS) {
      try {
        return NextResponse.json(await runAction(action, userId, pairId, params));
      } catch (err) {
        console.warn(`[api/db] ${action} failed, returning empty:`, err);
        return NextResponse.json(READ_DEFAULTS[action]);
      }
    }

    return NextResponse.json(await runAction(action, userId, pairId, params));
  } catch (error) {
    if (error instanceof InvalidActionError) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    console.error(
      "API /db error:",
      error instanceof Error ? `${error.message}\n${error.stack}` : JSON.stringify(error, Object.getOwnPropertyNames(error as object))
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function runAction(
  action: string,
  userId: string,
  pairId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Promise<unknown> {
  switch (action) {
    case "getMoods":
      return await getMoods(pairId);
    case "addMood":
      return await addMood(userId, pairId, params.mood, params.note);
    case "getActivities":
      return await getActivities(pairId);
    case "createActivity":
      return await createActivity(userId, pairId, params.title, params.type || "schedule", params.date, params.description, params.mood, params.isLive);
    case "toggleActivity":
      return await toggleActivity(userId, pairId, params.activityId, params.completed);
    case "updateActivity":
      return await updateActivity(userId, pairId, params.activityId, params.title, params.description, params.endTime, params.isLive);
    case "deleteActivity":
      return await deleteActivity(userId, pairId, params.activityId);
    case "getGallery":
      return await getGallery(pairId);
    case "addPhoto":
      return await addPhoto(userId, pairId, params.url, params.caption);
    case "deletePhoto":
      return await deletePhoto(userId, pairId, params.photoId);
    case "getCalendarEvents":
      return await getCalendarEvents(pairId);
    case "addCalendarEvent":
      return await addCalendarEvent(userId, pairId, params.title, params.date, params.type, params.description);
    case "updateCalendarEvent":
      return await updateCalendarEvent(userId, pairId, params.eventId, params.data);
    case "deleteCalendarEvent":
      return { success: await deleteCalendarEvent(userId, pairId, params.eventId) };
    case "getLetters":
      return await getLetters(pairId);
    case "createLetter":
      return await createLetter(userId, pairId, params.letter);
    case "deleteLetter":
      return { success: await deleteLetter(userId, pairId, params.letterId) };
    case "getNotifications":
      return await getNotifications(userId);
    case "markNotificationsAsRead":
      return await markNotificationsAsRead(userId);
    case "getPartnerId":
      return { partnerId: await getPartnerId(userId, pairId) };
    case "updatePresence":
      await updatePresence(userId, pairId, params.status);
      return { success: true };
    case "getPresence":
      return await getPresence(pairId);
    case "addStatusUpdate":
      return await addStatusUpdate(userId, pairId, params.message, params.emoji);
    case "getStatusUpdates":
      return await getStatusUpdates(pairId);
    case "sendHug":
      return await sendHug(userId, pairId, params.receiverId, params.message);
    case "getHugs":
      return await getHugs(pairId);
    case "updateLoveMeter":
      return await updateLoveMeter(userId, pairId, params.percentage);
    case "getLoveMeter":
      return await getLoveMeter(pairId);
    case "addLocation":
      return await addLocation(userId, pairId, params.place, params.note, params.lat, params.lng, params.accuracy);
    case "getLocations":
      return await getLocations(pairId);
    case "updateProfile":
      await updateProfile(userId, params.data);
      return { success: true };
    case "updateSettings":
      await updateSettings(userId, params.data);
      return { success: true };
    case "getUserSettings":
      return await getUserSettings(userId);
    case "getUserExtra":
      return await getUserExtra(pairId, params.key);
    case "setUserExtra":
      return await setUserExtra(userId, pairId, params.key, params.value);
    case "getAchievements":
      return await getAchievements(pairId);
    case "getChatMessages":
      return await getChatMessages(pairId);
    case "sendChatMessage":
      return await sendChatMessage(userId, pairId, params.receiverId, params.content);
    case "markChatRead":
      return await markChatRead(userId, pairId);
    case "getRinduNotifications":
      return await getRinduNotifications(pairId);
    case "sendRindu":
      return await sendRindu(userId, pairId, params.receiverId, params.level, params.message);
    case "respondRindu":
      return await respondRindu(userId, pairId, params.rinduId, params.response);
    default:
      throw new InvalidActionError();
  }
}

class InvalidActionError extends Error {}
