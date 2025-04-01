export default async function handler(req, res) {
  console.log("👀 API ROUTE HIT");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;

  const key = process.env.OPENAI_API_KEY;
  console.log("🔑 Key length:", key ? key.length : "NOT FOUND");

  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY not found in environment variables" });
  }

  if (!message) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are Baby Buddy 👶 — a calm, evidence-based expert helping new parents. Always respond with empathy and based on baby age if mentioned.",
          },
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error("❌ Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid OpenAI response", data });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("🔥 Caught error:", err);
    return res.status(500).json({ error: "Caught server error", details: err.message });
  }
}
