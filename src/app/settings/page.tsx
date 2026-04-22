import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import {
  ensureRenewalReminders,
  getRenewalReminderWindows,
  setRenewalReminderWindows
} from "@/db/renewalReminders";
import { env } from "@/env";
import { isGoogleConnected } from "@/gmail/oauth";

export const dynamic = "force-dynamic";

function parseWindows(value: string) {
  return value
    .split(",")
    .map((x) => Number.parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

async function saveWindows(formData: FormData) {
  "use server";

  const raw = String(formData.get("windows") ?? "");
  const windows = parseWindows(raw);

  const db = getDb();
  await setRenewalReminderWindows(db, windows);
  revalidatePath("/settings");
}

async function generateRenewalReminders() {
  "use server";

  const db = getDb();
  await ensureRenewalReminders(db);
  revalidatePath("/reminders");
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const db = getDb();
  const windows = await getRenewalReminderWindows(db);
  const gmailConnected = env.gmailEnabled ? await isGoogleConnected() : false;

  return (
    <div>
      <h1>Settings</h1>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Renewal reminder windows</h2>
        <p className="cardDesc">Comma-separated days (e.g. 60,30,7).</p>
        <form action={saveWindows}>
          <input
            name="windows"
            defaultValue={windows.join(",")}
            style={{ display: "block", marginTop: 6, width: "100%" }}
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Maintenance</h2>
        <form action={generateRenewalReminders}>
          <button type="submit">Generate renewal reminders now</button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Gmail integration</h2>
        {!env.gmailEnabled ? (
          <p className="cardDesc">Disabled. Set GMAIL_ENABLED=true to enable.</p>
        ) : gmailConnected ? (
          <>
            <p className="cardDesc">Connected.</p>
            <form action="/api/gmail/disconnect" method="post">
              <button type="submit">Disconnect Gmail</button>
            </form>
          </>
        ) : (
          <>
            <p className="cardDesc">Not connected.</p>
            <a className="navLink" href="/api/gmail/oauth/start">
              Connect Gmail
            </a>
          </>
        )}
      </div>
    </div>
  );
}
