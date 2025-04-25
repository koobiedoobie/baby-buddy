export default async function handler(req, res) {
  console.log("✅ Babywise API (chat) called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OpenAI API key" });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing or invalid 'messages' array" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
      }),
    });

    const raw = await response.text();
    console.log("📜 Raw GPT Response:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Failed to parse GPT JSON:", e);
      return res.status(500).json({ error: "OpenAI response not JSON", raw });
    }

    if (!response.ok) {
      console.error("❌ GPT API error:", data);
      return res.status(response.status).json({ error: data });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error("❌ GPT response missing content:", data);
      return res.status(500).json({ error: "No reply returned", data });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ OpenAI request failed:", err);
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
