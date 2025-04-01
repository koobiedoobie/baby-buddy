// MVP Baby Buddy App (React Native with basic components + GPT Integration)

import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function BabyBuddy() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! I'm Baby Buddy 👶 – ask me anything about your baby's sleep, feeding, development, and more!",
    },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMsg = { sender: "bot", text: "Oops! Something went wrong. Please try again." };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Baby Buddy 👶</Text>

      <ScrollView style={styles.chatContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.sender === "bot" ? styles.botMessage : styles.userMessage,
            ]}
          >
            <Text style={msg.sender === "bot" ? styles.botText : styles.userText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask me anything about your baby..."
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
    marginBottom: 8,
  },
  botMessage: {
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
  },
  botText: {
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sendButton: {
    padding: 10,
    backgroundColor: "#2563eb",
    borderRadius: 50,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
