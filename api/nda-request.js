export const config = {
  api: {
    bodyParser: false,
  },
};

import { Readable } from "stream";

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(rawBody);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseBody(req);
    const { name, email, institution, message, timestamp } = body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const githubToken = process.env.GH_PAT_FOR_VERL_API;
    const githubRepo = "Metaldrugs/metaldrug-review-api";
    const eventType = "nda-review-request";

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {
          name,
          email,
          institution,
          message,
          timestamp: timestamp || new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: "Dispatch failed", details: error });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Request failed", message: err.message });
  }
}
