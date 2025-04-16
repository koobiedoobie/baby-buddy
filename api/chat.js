export default async function handler(req, res) {
  console.log("✅ Babywise API called");

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
        content: `You are Babywise, an AI parenting assistant for babies aged 0–2.
Offer one actionable, warm, and age-appropriate parenting tip per day.
Your tone should be kind, practical, and supportive — like a nanny who knows developmental milestones.
ALWAYS append 1 or 2 trusted source links at the end in markdown format.
Use links from WHO, AAP, NHS, or CDC. For example: [WHO Sleep Guidelines](https://www.who.int/publications/i/item/9789241550536)`,
      },
      {
        role: "user",
        content: `My baby, ${babyName}, is ${ageString} old. ${gender ? `She is a ${gender}. ` : ""}She was born on ${birthdate}.
What is one helpful parenting tip I can try today that’s right for her age? Include real source links.`,
      },
    ];
  } else {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages is required and must be an array" });
    }

    finalMessages = [
      {
        role: "system",
        content: `You are Babywise, a kind and medically-informed AI copilot for parents of babies under 2.
Speak in a warm, conversational tone. Avoid saying "I'm not a doctor."
If the topic involves feeding, sleep, safety, development, etc., include trusted medical sources at the end in markdown format.
Only use sources like WHO, AAP, NHS, CDC.`,
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
        temperature: 0.7,
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
