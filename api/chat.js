// === ✅ Fixed /api/chat handler ===
export default async function handler(req, res) {
  console.log("✅ Baby Buddy API called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { messages, type, babyName, birthdate, gender, ageString } = req.body;
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    console.error("❌ Missing OpenAI API key in environment variables");
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  let finalMessages = [];

  if (type === "tip") {
    if (!babyName || !birthdate || !ageString) {
      return res.status(400).json({ error: "Missing required baby data for tip request." });
    }

    finalMessages = [
      {
        role: "system",
        content: `You are Babywise, a warm and supportive AI parenting guide.
You give one developmentally appropriate, actionable, and encouraging tip per day based on the baby's exact age.
Tips should be realistic and match the real-life needs of parents with babies or toddlers between 0–2 years old.
Never recommend tummy time for children over 9 months old. Do not address the baby directly.
Keep the tone kind, warm, and helpful — as if you're a trusted nanny.`,
      },
      {
        role: "user",
        content: `My baby, ${babyName}, is ${ageString} old. ${
          gender ? `She is a ${gender}. ` : ""
        }She was born on ${birthdate}.
What is one helpful, practical parenting tip or suggestion I can try today that is right for her age? Please respond in 2–3 warm, friendly sentences.`,
      },
    ];
  } else {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages is required and must be an array" });
    }

    finalMessages = [
      {
        role: "system",
        content:
          "You are Babywise, a warm, conversational, and supportive AI co-parent for infants aged 0–2 years. Avoid disclaimers unless absolutely necessary. Do not recommend consulting a doctor unless the situation is clearly urgent or dangerous. Speak like a caring nanny who's always there to help. Keep answers concise, personal, and reassuring.",
      },
      ...messages,
    ];
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: finalMessages,
      }),
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]?.message?.content) {
      console.error("❌ Invalid OpenAI response:", data);
      return res.status(500).json({ error: "Invalid response from OpenAI", data });
    }

    const reply = data.choices[0].message.content.trim();
    console.log("✅ Reply sent:", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("🔥 Error from OpenAI API:", err);
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
