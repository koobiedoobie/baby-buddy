export default async function handler(req, res) {
  console.log("✅ Baby Buddy API called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { message } = req.body;
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    console.error("❌ Missing OpenAI API key in environment variables");
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required and must be a string" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-1106-preview", // ✅ Correct model
        messages: [
          {
            role: "system",
            content:
              "You are Baby Buddy 👶 — a calm, warm, evidence-based expert helping new parents. Always tailor your answers to the baby's age if mentioned.",
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
