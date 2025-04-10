export default async function handler(req, res) {
  console.log("✅ Baby Buddy API called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const { messages, type, babyName, birthdate, gender } = req.body;
  const key = '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';  // Your API key

  if (!key) {
    console.error("❌ Missing OpenAI API key in environment variables");
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  // 🧠 If request is for a daily tip instead of regular chat
  let finalMessages = [];

  if (type === "tip") {
    // Calculate baby's age
    const babyAge = calculateAge(birthdate);

    // Use a specific tip-oriented system + user prompt
    finalMessages = [
      {
        role: "system",
        content:
          "You are Baby Buddy, a warm, supportive AI co-parent. Based on the baby's age and background, you give one friendly, age-appropriate tip or encouragement per day. Keep it short, specific, and helpful. Avoid general advice. Do not speak to the baby. Speak kindly to the parent, as a trusted nanny would.",
      },
      {
        role: "user",
        content: `The baby's name is ${babyName}. ${
          gender ? `They are a ${gender}.` : ""
        } They were born on ${birthdate}. They are ${babyAge} years old. Please provide today's parenting tip or encouragement based on their developmental stage.`,
      },
    ];
  } else {
    // Default: regular chat flow
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages is required and must be an array" });
    }

    finalMessages = [...messages];

    finalMessages.unshift({
      role: "system",
      content: `You are Baby Buddy, a warm, conversational, and supportive AI co-parent for infants aged 0–2 years. Avoid disclaimers unless absolutely necessary. Do not recommend consulting a doctor unless the situation is clearly urgent or dangerous. Speak like a caring nanny who's always there to help. Keep answers concise, personal, and reassuring.`,
    });
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
        messages: finalMessages,
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

// Helper function to calculate the age of the baby based on birthdate
function calculateAge(birthdate) {
  const birthDate = new Date(birthdate);
  const currentDate = new Date();
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const month = currentDate.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && currentDate.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
