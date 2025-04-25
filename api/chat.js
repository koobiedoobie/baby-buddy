export default async function handler(req, res) {
  console.log("✅ Babywise API (simplified) called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { type, babyName, birthdate, gender, ageString } = req.body;

  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: "Missing OpenAI API key" });

  if (type !== "tip") {
    return res.status(400).json({ error: "Unsupported request type" });
  }

  if (!babyName || !birthdate || !ageString) {
    return res.status(400).json({ error: "Missing baby data for tip request." });
  }

  const finalMessages = [
    {
      role: "system",
      content: `You are Babywise, a warm and knowledgeable AI parenting assistant. Your job is to provide one helpful, evidence-based, medically-informed tip tailored to a baby’s age. Keep it short, actionable, and emotionally supportive. Cite WHO, AAP, or real best practices if helpful.`,
    },
    {
      role: "user",
      content: `Baby profile:
- Name: ${babyName}
- Gender: ${gender || "unspecified"}
- Birthdate: ${birthdate}
- Age: ${ageString}

What is one gentle, helpful tip I can try today?`,
    },
  ];

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
      return res.status(500).json({ error: "No tip returned", data });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ OpenAI request failed:", err);
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
