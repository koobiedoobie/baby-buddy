export default async function handler(req, res) {
  console.log("✅ Baby Buddy API called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { messages } = req.body;
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    console.error("❌ Missing OpenAI API key in environment variables");
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages is required and must be an array" });
  }

  // 👉 Add the system prompt for tone/personality
  messages.unshift({
    role: "system",
    content: `You are Baby Buddy, a warm, conversational, and supportive AI co-parent for infants aged 0–2 years. Avoid disclaimers unless absolutely necessary. Do not recommend consulting a doctor unless the situation is clearly urgent or dangerous. Speak like a caring nanny who's always there to help. Keep answers concise, personal, and reassuring.`,
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error("❌ Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI", data });
    }

    const reply = data.choices[0].message.content;
    console.log("✅ Reply sent:", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("🔥 Error from OpenAI API:", err);
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
