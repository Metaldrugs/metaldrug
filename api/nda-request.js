export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { name, email, institution } = req.body;

  const ndaLink = "https://metaldrug.com/KT-MetalDrug-NDA.pdf";

  const githubResponse = await fetch('https://api.github.com/repos/Metaldrugs/metaldrug-nda-submissions/dispatches', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: "nda_review_request",
      client_payload: { name, email, institution }
    }),
  });

  if (!githubResponse.ok) {
    return res.status(500).json({ error: "GitHub dispatch failed" });
  }

  return res.status(200).json({
    message: "Review request received.",
    nda: ndaLink
  });
}
