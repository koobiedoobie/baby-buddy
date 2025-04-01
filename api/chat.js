export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { message } = req.body;
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
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
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are Baby Buddy 👶 — a warm, calm, expert that helps new parents with evidence-based advice. Respond with empathy and based on baby age if relevant.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "Invalid response from OpenAI", data });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
