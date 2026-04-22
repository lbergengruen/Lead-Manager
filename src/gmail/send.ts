import "server-only";

import { getValidAccessToken } from "@/gmail/oauth";

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function buildRawEmail({
  to,
  subject,
  body
}: {
  to: string;
  subject: string;
  body: string;
}) {
  // Minimal RFC 2822 message
  const message = [`To: ${to}`, `Subject: ${subject}`, "", body].join("\r\n");
  return base64UrlEncode(Buffer.from(message, "utf8"));
}

export async function sendGmail({
  to,
  subject,
  body
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const accessToken = await getValidAccessToken();

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        raw: buildRawEmail({ to, subject, body })
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed: ${text}`);
  }

  const json = (await res.json()) as { id: string; threadId?: string };
  return json;
}
