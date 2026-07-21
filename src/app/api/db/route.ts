import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/actions/auth";
import {
  getMoods,
  addMood,
  getActivities,
  createActivity,
  toggleActivity,
  getGallery,
  addPhoto,
  deletePhoto,
  getCalendarEvents,
  addCalendarEvent,
  getLetters,
  createLetter,
  getNotifications,
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
      case "getLetters":
        return NextResponse.json(await getLetters(pairId));
      case "createLetter":
        return NextResponse.json(await createLetter(userId, pairId, params.letter));
      case "getNotifications":
        return NextResponse.json(await getNotifications(userId));
      case "updateProfile":
        await updateProfile(userId, params.data);
        return NextResponse.json({ success: true });
      case "updateSettings":
        await updateSettings(userId, params.data);
        return NextResponse.json({ success: true });
      case "getUserSettings":
        return NextResponse.json(await getUserSettings(userId));
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
