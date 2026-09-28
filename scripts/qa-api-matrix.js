/* QA matrix: hit every /api/db action as both roles, print pass/fail. */
const BASE = process.env.QA_BASE_URL || "http://127.0.0.1:3000";

async function login(role, password) {
  const r = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", role, password }),
  });
  const setCookies = r.headers.getSetCookie?.() || [];
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, user: data.user, cookie };
}

async function call(cookie, action, params = {}) {
  const r = await fetch(`${BASE}/api/db`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ action, ...params }),
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 80); }
  return { status: r.status, data };
}

const results = [];
function rec(name, ok, extra = "") {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
}

async function main() {
  // PINs dari env — jangan hardcode credentials di repo.
  // Jalankan: OWNER_PIN=xxx PARTNER_PIN=yyy node scripts/qa-api-matrix.js
  const ownerPin = process.env.OWNER_PIN;
  const partnerPin = process.env.PARTNER_PIN;
  if (!ownerPin || !partnerPin) {
    console.error("Set OWNER_PIN dan PARTNER_PIN env vars dulu.");
    process.exit(1);
  }
  const ryo = await login("owner", ownerPin);
  const ara = await login("partner", partnerPin);
  rec("login owner", ryo.ok && ryo.user?.id === "user-1");
  rec("login partner", ara.ok && ara.user?.id === "user-2");

  const bad = await login("owner", "00000000");
  rec("login wrong PIN rejected", !bad.ok);
  const cross = await login("owner", partnerPin);
  rec("login cross-role rejected", !cross.ok);

  const R = ryo.cookie, A = ara.cookie;

  // ── Reads ──
  const reads = ["getMoods","getActivities","getGallery","getCalendarEvents","getLetters",
    "getNotifications","getPartnerId","getPresence","getStatusUpdates","getHugs",
    "getLoveMeter","getLocations","getUserSettings","getAchievements","getChatMessages","getRinduNotifications"];
  for (const a of reads) {
    const r = await call(R, a);
    rec(`read ${a}`, r.status === 200, r.status !== 200 ? JSON.stringify(r.data).slice(0, 80) : "");
  }
  const r = await call(R, "getUserExtra", { key: "qa_test" });
  rec("read getUserExtra", r.status === 200);

  // ── Writes (owner) ──
  let r2 = await call(R, "addMood", { mood: "happy", note: "QA mood" });
  rec("addMood", r2.status === 200 && r2.data?.id, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "createActivity", { title: "QA activity", type: "schedule", date: new Date().toISOString(), description: "test", mood: "happy", isLive: true });
  rec("createActivity", r2.status === 200 && r2.data?.id, JSON.stringify(r2.data).slice(0, 80));
  const actId = r2.data?.id;
  if (actId) {
    r2 = await call(R, "updateActivity", { activityId: actId, title: "QA activity edited", isLive: false, endTime: new Date().toISOString() });
    rec("updateActivity", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
    r2 = await call(R, "toggleActivity", { activityId: actId, completed: true });
    rec("toggleActivity", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
    r2 = await call(R, "deleteActivity", { activityId: actId });
    rec("deleteActivity", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
  }

  r2 = await call(R, "createLetter", { letter: { title: "QA letter", content: "isi test", type: "love_letter" } });
  rec("createLetter", r2.status === 200 && r2.data?.id, JSON.stringify(r2.data).slice(0, 80));
  const letterId = r2.data?.id;
  if (letterId) {
    r2 = await call(R, "deleteLetter", { letterId });
    rec("deleteLetter", r2.status === 200);
  }

  r2 = await call(R, "addCalendarEvent", { title: "QA event", date: new Date().toISOString(), type: "vc", description: "test" });
  rec("addCalendarEvent", r2.status === 200 && r2.data?.id, JSON.stringify(r2.data).slice(0, 80));
  const evId = r2.data?.id;
  if (evId) {
    r2 = await call(R, "updateCalendarEvent", { eventId: evId, data: { title: "QA event edited" } });
    rec("updateCalendarEvent", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
    r2 = await call(R, "deleteCalendarEvent", { eventId: evId });
    rec("deleteCalendarEvent", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
  }

  r2 = await call(R, "addStatusUpdate", { message: "QA status", emoji: "💬" });
  rec("addStatusUpdate", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "sendHug", { receiverId: "user-2", message: "QA hug" });
  rec("sendHug", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "updateLoveMeter", { percentage: 88 });
  rec("updateLoveMeter", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "addLocation", { place: "QA place", note: "test", lat: -6.2, lng: 106.8, accuracy: 20 });
  rec("addLocation", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "sendChatMessage", { receiverId: "user-2", content: "QA chat message" });
  rec("sendChatMessage", r2.status === 200 && r2.data?.id, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "sendRindu", { receiverId: "user-2", level: "rindu", message: "QA rindu" });
  rec("sendRindu", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "setUserExtra", { key: "qa_test", value: "hello" });
  rec("setUserExtra", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
  r2 = await call(R, "getUserExtra", { key: "qa_test" });
  rec("getUserExtra roundtrip", r2.status === 200 && r2.data === "hello", JSON.stringify(r2.data).slice(0, 60));

  r2 = await call(R, "updatePresence", { status: "online" });
  rec("updatePresence", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "updateSettings", { data: { relationshipStartDate: "2024-10-29" } });
  rec("updateSettings", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  r2 = await call(R, "updateProfile", { data: { relationship: "QA rel" } });
  rec("updateProfile", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));

  // ── Partner reads owner data (RLS pair-scope) ──
  r2 = await call(A, "getMoods");
  rec("partner sees owner mood", r2.status === 200 && Array.isArray(r2.data) && r2.data.some(m => m.note === "QA mood"), `count=${r2.data?.length}`);
  r2 = await call(A, "getChatMessages");
  rec("partner sees chat", r2.status === 200 && r2.data.some(m => m.content === "QA chat message"));
  r2 = await call(A, "getRinduNotifications");
  rec("partner sees rindu", r2.status === 200 && r2.data.some(m => m.message === "QA rindu"), `count=${r2.data?.length}`);
  r2 = await call(A, "getUserExtra", { key: "qa_test" });
  rec("partner sees shared extra", r2.status === 200 && r2.data === "hello", JSON.stringify(r2.data).slice(0, 60));
  r2 = await call(A, "getUserSettings");
  rec("partner sees settings", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
  r2 = await call(A, "getNotifications");
  rec("partner has notifications", r2.status === 200 && r2.data.length > 0, `count=${r2.data?.length}`);

  // markNotificationsAsRead + markChatRead as partner
  r2 = await call(A, "markNotificationsAsRead");
  rec("markNotificationsAsRead", r2.status === 200);
  r2 = await call(A, "markChatRead");
  rec("markChatRead", r2.status === 200);

  // respondRindu as partner (receiver)
  const rindus = await call(A, "getRinduNotifications");
  const rinduId = rindus.data?.[0]?.id;
  if (rinduId) {
    r2 = await call(A, "respondRindu", { rinduId, response: "aku_juga" });
    rec("respondRindu", r2.status === 200, JSON.stringify(r2.data).slice(0, 80));
  }

  // invalid action
  r2 = await call(R, "nonExistentAction");
  rec("invalid action → 400", r2.status === 400);
  // no auth
  r2 = await call("", "getMoods");
  rec("no-auth → 401", r2.status === 401);

  // cleanup QA data
  await call(R, "setUserExtra", { key: "qa_test", value: "" });

  console.log(results.join("\n"));
  const fails = results.filter(r => r.startsWith("FAIL"));
  console.log(`\n=== ${results.length - fails.length}/${results.length} PASS, ${fails.length} FAIL ===`);
}

main().catch(e => { console.error("FATAL", e); process.exit(1); });
