import { db } from "../../utils/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { subDays } from "date-fns";

export default async function handler(req, res) {
  console.log("✅ Babywise API called");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  const {
    messages, type, babyId, babyName, birthdate, gender, ageString
  } = req.body;
  const key = process.env.OPENAI_API_KEY;

  if (!key) return res.status(500).json({ error: "Missing OpenAI API key" });

  let sleepSummary = "No recent sleep logs found.";
  let foodSummary = "No recent food logs found.";

  try {
    if (babyId) {
      const since = subDays(new Date(), 3).toISOString();

      // 💤 Fetch Sleep Logs
      const sleepQuery = query(
        collection(db, "babies", babyId, "sleepLogs"),
        where("start", ">=", since),
        orderBy("start", "desc")
      );
      const sleepSnapshot = await getDocs(sleepQuery);
      const sleepData = sleepSnapshot.docs.map(doc => doc.data());

      if (sleepData.length) {
        const grouped = {};
        sleepData.forEach(log => {
          const date = new Date(log.start).toDateString();
          const duration = (new Date(log.end) - new Date(log.start)) / (1000 * 60);
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(duration);
        });

        sleepSummary = Object.entries(grouped).map(([date, durations]) => {
          const naps = durations.map(d => `${Math.floor(d / 60)}h ${d % 60}m`).join(", ");
          return `- ${date}: ${durations.length} naps (${naps})`;
        }).join("\n");
      }

      // 🍽 Fetch Food Logs
      const foodQuery = query(
        collection(db, "babies", babyId, "foodLogs"),
        where("timestamp", ">=", since),
        orderBy("timestamp", "desc")
      );
      const foodSnapshot = await getDocs(foodQuery);
      const foodData = foodSnapshot.docs.map(doc => doc.data());

      if (foodData.length) {
        foodSummary = foodData.map(log => {
          const time = new Date(log.timestamp).toLocaleString();
          const ings = log.ingredients?.map(i => i.name).join(", ") || "no ingredients listed";
          const note = log.note ? `(${log.note})` : "";
          return `- ${log.dishName} [${ings}] at ${time} ${note}`;
        }).join("\n");
      }
    }
  } catch (e) {
    console.warn("⚠️ Error fetching logs:", e);
  }

  let finalMessages = [];

  if (type === "tip") {
    if (!babyName || !birthdate || !ageString) {
      return res.status(400).json({ error: "Missing baby data for tip request." });
    }

    finalMessages = [
      {
        role: "system",
        content: `You are Babywise, a loving and medically-informed AI parenting co-pilot. Offer personalized parenting tips based on real baby data (sleep, food). Be practical, supportive, kind, and reference sources like WHO or AAP.`,
      },
      {
        role: "user",
        content: `Baby profile: ${babyName} (${gender || "unspecified"}, born ${birthdate}, age ${ageString}).

Recent Sleep:
${sleepSummary}

Recent Food:
${foodSummary}

What is a helpful and relevant parenting tip I can try today?`,
      },
    ];
  } else {
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array." });
    }

    finalMessages = [
      {
        role: "system",
        content: `You are Babywise, a warm, medically-informed AI parenting co-pilot. You personalize responses based on baby profiles and recent logs. Avoid disclaimers and give kind, confident guidance.`,
      },
      {
        role: "user",
        content: `Baby profile: ${babyName} (${gender || "unspecified"}, born ${birthdate}, age ${ageString}).

Recent Sleep:
${sleepSummary}

Recent Food:
${foodSummary}`,
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

    if (!data?.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: "Invalid OpenAI response", data });
    }

    return res.status(200).json({ reply: data.choices[0].message.content.trim() });
  } catch (err) {
    return res.status(500).json({ error: "OpenAI call failed", details: err.message });
  }
}
