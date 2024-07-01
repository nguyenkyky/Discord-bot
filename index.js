const { Client, GatewayIntentBits } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const axios = require("axios");

const config = require("./config");

const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const token = process.env.TOKEN;
const openaiApiKey = process.env.OPENAI_KEY;
const channelId = process.env.PETNEIT_ID;
const geminiApiKey = process.env.GEMINI_KEY;

const configuration = new GoogleGenerativeAI(geminiApiKey);

const modelId = "gemini-pro";
const model = configuration.getGenerativeModel({ model: modelId });

// When the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Send a greeting message to the channel
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send("Chào các bé");
  } else {
    console.error("Channel not found!");
  }
});

const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "sk-proj-1EqPiUTzV4dcrovi6T3uT3BlbkFJNwwATgi0TBzH9YysJyxb";

// Hàm gọi API OpenAI
async function askChatGPT(question) {
  try {
    console.log(question);
    if (question) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "babbage-002",
          messages: [{ role: "user", content: question }],
          max_tokens: 20,
        }),
      });

      const data = await response.json();

      // Kiểm tra nếu phản hồi có cấu trúc mong đợi
      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content.trim(); // Truy cập nội dung phản hồi
        return reply;
      } else {
        console.error("Invalid API response structure:", data);
        return "Sorry, I couldn't get a response from ChatGPT.";
      }
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Sorry, I couldn't get a response from ChatGPT.";
  }
}

async function askGemini(question) {
  try {
    const prompt = question;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    return text;
  } catch (err) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I couldn't get a response from Gemini.";
  }
}

// Define command to send notifications on request
client.on("messageCreate", async (message) => {
  if (!message.author.bot && message.content.startsWith("!notify")) {
    const notification = message.content.slice(8).trim();
    if (notification) {
      message.channel.send(notification);
    } else {
      message.reply("Vui lòng cung cấp nội dung thông báo!");
    }
  }

  if (!message.author.bot && message.content.startsWith("!chửi")) {
    if (!message.author.bot && message.content.includes("!chửi Kỳ")) {
      // Gửi tin nhắn "dm thằng Tiến" vào kênh
      message.channel.send("Không được chửi Kỳ");
    } else {
      const args = message.content.slice(6).trim().split(" ");
      const name = args[0];
      const times = args.length > 1 ? parseInt(args[1]) : 1;

      if (name && !isNaN(times) && times > 0) {
        let msg = "";
        for (let i = 0; i < times; i++) {
          msg += `dm thằng ${name} `;
        }
        message.channel.send(msg.trim());
      } else {
        message.reply("Vui lòng cung cấp tên và số lần hợp lệ!");
      }
    }
  }

  if (!message.author.bot && message.content.startsWith("!ask")) {
    const question = message.content.slice(4).trim();
    if (question) {
      const response = await askGemini(question);
      message.channel.send(response);
    } else {
      message.reply("Vui lòng cung cấp câu hỏi cho ChatGPT!");
    }
  }
});

client.on("error", (error) => {
  console.error("There was an error:", error);
});

// Log in bot
client.login(token);
