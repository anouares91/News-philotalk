import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import axios from "axios";
import Stripe from "stripe";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import { GoogleGenAI, Type, Modality } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
let db: FirebaseFirestore.Firestore | null = null;

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
  }
  db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
}

let geminiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Stripe webhook needs the raw body, so we define it BEFORE express.json()
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is missing.");
      return res.status(400).send("Webhook secret missing");
    }

    let event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const planName = session.metadata?.planName;

      if (userId && planName && db) {
        try {
          await db.collection("users").doc(userId).update({
            plan: planName,
          });
          console.log(`Successfully updated user ${userId} to plan ${planName}`);
        } catch (error) {
          console.error("Error updating user plan in Firestore:", error);
        }
      } else {
        console.error("Missing userId, planName, or db connection in webhook.");
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Seamless ambient background music generator
  app.get("/api/ambient-music", (req, res) => {
    const sampleRate = 22050;
    const duration = 12;
    const numSamples = sampleRate * duration;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // RIFF header
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
    buffer.writeUInt16LE(1, 20); // audioFormat 1 (PCM)
    buffer.writeUInt16LE(1, 22); // numChannels 1 (mono)
    buffer.writeUInt32LE(sampleRate, 24); // sampleRate
    buffer.writeUInt32LE(sampleRate * 2, 28); // byteRate
    buffer.writeUInt16LE(2, 32); // blockAlign
    buffer.writeUInt16LE(16, 34); // bitsPerSample
    buffer.write("data", 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Warm, calming ambient chord: D3 (146.83 Hz), A3 (220 Hz), F#3 (185 Hz) with gentle shimmer
      const lfo = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * t);
      const fade = Math.sin((Math.PI * i) / numSamples);
      const s1 = Math.sin(2 * Math.PI * 146.83 * t) * 0.4;
      const s2 = Math.sin(2 * Math.PI * 220.00 * t) * 0.3;
      const s3 = Math.sin(2 * Math.PI * 185.00 * t) * 0.25;
      const sampleVal = Math.max(-1, Math.min(1, (s1 + s2 + s3) * lfo * fade * 0.3));
      const intVal = Math.floor(sampleVal * 32767);
      buffer.writeInt16LE(intVal, 44 + i * 2);
    }

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  });

  app.get("/api/topics", (req, res) => {
    const topics = [
      { id: "reality", name: "Reality", description: "What is real? Explore the nature of reality and existence.", example: "Is the world around us merely an illusion?" },
      { id: "existence", name: "Existence", description: "The meaning of life and what it means to exist.", example: "To be, or not to be? What defines our existence?" },
      { id: "time", name: "Time", description: "The flow of time, past, present, and future.", example: "Is time a linear progression, or a human construct?" },
      { id: "truth", name: "Truth", description: "Objective vs subjective truth and how we know it.", example: "Can we ever attain absolute truth?" },
      { id: "knowledge", name: "Knowledge", description: "Epistemology: how we acquire and validate knowledge.", example: "How do we know what we claim to know?" },
      { id: "god", name: "God", description: "The existence and nature of a higher power.", example: "Does the universe require a creator?" },
      { id: "human_nature", name: "Human Nature", description: "Are humans inherently good or evil?", example: "Are we born as blank slates, or with innate morality?" },
      { id: "ethics", name: "Ethics", description: "Right and wrong, and how we should act.", example: "What is the foundation of moral duty?" },
      { id: "justice", name: "Justice", description: "Fairness, law, and the ideal society.", example: "What constitutes a just society?" }
    ];
    res.json(topics);
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { planName, price, userId } = req.body;
      const stripe = getStripe();

      // Convert price string like "$9.99" to cents (999)
      const unitAmount = Math.round(parseFloat(price.replace('$', '')) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planName,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.headers.origin}/subscription?success=true&plan=${encodeURIComponent(planName)}`,
        cancel_url: `${req.headers.origin}/subscription?canceled=true`,
        client_reference_id: userId,
        metadata: {
          planName: planName
        }
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video/generate", async (req, res) => {
    const { dialogue, philosopher1, philosopher2, philosopher1Voice, philosopher2Voice, language } = req.body;
    
    if (!process.env.HEYGEN_API_KEY) {
      return res.status(500).json({ error: "HEYGEN_API_KEY not configured in environment variables." });
    }

    const isArabic = language === "ar";
    // Heygen Arabic voices: ar-EG-SalmaNeural, ar-EG-ShakirNeural, etc.
    const p1VoiceId = isArabic ? "ar-EG-ShakirNeural" : "en-US-GuyNeural";
    const p2VoiceId = isArabic ? "ar-EG-SalmaNeural" : "en-US-JennyNeural";

    try {
      // Attempt to retrieve active avatar IDs from the user's HeyGen workspace
      let p1Avatar = "f797e158-9a6d-4723-9246-441f04f2d1a2";
      let p2Avatar = "379058b8849b4931b67484f339678170";

      try {
        const avatarsRes = await axios.get("https://api.heygen.com/v2/avatars", {
          headers: { "X-Api-Key": process.env.HEYGEN_API_KEY },
          timeout: 7000
        });
        const avatars = avatarsRes.data?.data?.avatars;
        if (Array.isArray(avatars) && avatars.length >= 2) {
          p1Avatar = avatars[0].avatar_id;
          p2Avatar = avatars[1].avatar_id;
        } else if (Array.isArray(avatars) && avatars.length === 1) {
          p1Avatar = avatars[0].avatar_id;
          p2Avatar = avatars[0].avatar_id;
        }
      } catch (err: any) {
        console.warn("Could not query HeyGen avatars dynamically, using defaults:", err.message);
      }

      // Map dialogue to Heygen video inputs
      const scenes = dialogue.slice(0, 10);
      
      const video_inputs = scenes.map((exchange: any) => {
        const isP1 = exchange.speaker === philosopher1;
        return {
          character: {
            type: "avatar",
            avatar_id: isP1 ? p1Avatar : p2Avatar,
            avatar_style: "normal"
          },
          voice: {
            type: "text",
            input_text: exchange.text,
            voice_id: isP1 ? p1VoiceId : p2VoiceId
          }
        };
      });

      console.log("Sending request to Heygen with", video_inputs.length, "scenes");

      const response = await axios.post("https://api.heygen.com/v2/video/generate", {
        video_inputs,
        dimension: {
          width: 1280,
          height: 720
        }
      }, {
        headers: {
          "X-Api-Key": process.env.HEYGEN_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log("Heygen API success:", response.data);
      res.json(response.data);
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error("Heygen API error details:", JSON.stringify(errorData, null, 2) || error.message);
      
      let errorMessage = "Failed to generate video with Heygen";
      if (errorData?.message) {
        errorMessage = `Heygen Error: ${errorData.message}`;
      } else if (errorData?.error?.message) {
        errorMessage = `Heygen Error: ${errorData.error.message}`;
      } else if (error.message) {
        errorMessage = `Heygen Error: ${error.message}`;
      }

      res.status(error.response?.status || 500).json({ 
        error: errorMessage,
        details: errorData || error.message
      });
    }
  });

  app.get("/api/video/status/:videoId", async (req, res) => {
    const { videoId } = req.params;
    
    if (!process.env.HEYGEN_API_KEY) {
      return res.status(500).json({ error: "HEYGEN_API_KEY not configured." });
    }

    try {
      const response = await axios.get(`https://api.heygen.com/v2/video/status/${videoId}`, {
        headers: {
          "X-Api-Key": process.env.HEYGEN_API_KEY
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Heygen Status error:", error.response?.data || error.message);
      res.status(500).json({ 
        error: "Failed to get video status",
        details: error.response?.data || error.message
      });
    }
  });

  // --- Gemini API Endpoints ---
  app.post("/api/gemini/suggest-topic", async (req, res) => {
    try {
      const { generationMode, topicSearch, languageName, p1, p2 } = req.body;
      const ai = getGeminiClient();
      const prompt = generationMode === "solo" 
        ? `Suggest 5 interesting topics for a solo podcast monologue or voiceover.
           ${topicSearch ? `The topics should be related to: "${topicSearch}".` : ""}
           Return ONLY the topic names as a JSON array of strings.
           Language: ${languageName || "English"}`
        : `Suggest 5 profound philosophical topics for a debate between ${p1 || "Philosopher 1"} and ${p2 || "Philosopher 2"}. 
           ${topicSearch ? `The topics should be related to: "${topicSearch}".` : ""}
           Return ONLY the topic names as a JSON array of strings. 
           Language: ${languageName || "English"}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const result = JSON.parse(response.text?.trim() || "[]");
      res.json({ topics: result });
    } catch (error: any) {
      console.error("Gemini suggest-topic error:", error);
      res.status(500).json({ error: error.message || "Failed to suggest topics" });
    }
  });

  app.post("/api/gemini/search-book", async (req, res) => {
    try {
      const { bookTitle, topicSearch, languageName } = req.body;
      const ai = getGeminiClient();
      const prompt = `Search for a book related to: "${bookTitle || topicSearch}". Provide the most accurate Title and Author. Language: ${languageName || "English"}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING }
            },
            required: ["title", "author"]
          }
        }
      });
      const result = JSON.parse(response.text?.trim() || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Gemini search-book error:", error);
      res.status(500).json({ error: error.message || "Failed to search book" });
    }
  });

  app.post("/api/gemini/generate-dialogue", async (req, res) => {
    try {
      const { generationMode, p1, p1Desc, p2, p2Desc, finalTopic, languageName, userQuestion } = req.body;
      const ai = getGeminiClient();

      let prompt = "";
      if (generationMode === "solo") {
        prompt = `
          You are an expert AI voiceover script generator.
          Your task is to create a compelling, high-quality monologue script for a single narrator.
          The script should be engaging, informative, and viral-friendly.
          
          Core Rule:
          The script MUST start with a strong attention-grabbing hook in the first sentence.
          Do NOT start with greetings or introductions.
          
          Emotion System:
          Each line must include an emotion tag to guide voice tone.
          Use emotions like: (calm), (dramatic), (intense), (thoughtful), (confident), (serious), (curious), (reflective), (challenging), (emotional).
          
          General Rules:
          - No greetings
          - No introductions
          - Strong hook at start
          - Natural human narration
          - Short sentences
          - Small pauses (…) for realism
          - Maximum duration 30–40 seconds
          - End with a thought-provoking closing statement or question
          
          Topic: ${finalTopic}
          Language: ${languageName || "English"}
          ${userQuestion ? `Specific Direction: "${userQuestion}"` : ""}
        `;
      } else {
        prompt = `
          You are an expert AI philosophical podcast script generator for a modern short video application.
          Your task is to create short, engaging, and viral philosophical dialogue between two philosophers in a modern podcast studio.
 
          Core Rule:
          The script MUST start with a strong attention-grabbing hook in the first sentence.
          Do NOT start with greetings or introductions.
          The first line must immediately capture attention with a bold philosophical idea, provocative question, unexpected insight, or debatable claim.
 
          Emotion System:
          Each line must include an emotion tag to guide AI avatar movement and voice tone.
          Use emotions like: (calm), (dramatic), (intense), (thoughtful), (confident), (serious), (curious), (reflective), (challenging), (emotional).
 
          Philosopher Speaking Styles:
          * Socrates: calm, curious, asks deep questions
          * Plato: rational and structured
          * Aristotle: logical and practical
          * Nietzsche: bold and intense
          * Dostoevsky: emotional and psychological
          * Ibn Sina: intellectual and calm
          * Descartes: logical and analytical
          * Kant: structured and moral
          * Confucius: wise and peaceful
          * Any other philosopher: adapt to their authentic style
 
          General Rules:
          - No greetings
          - No introductions
          - Strong hook at start
          - Simple modern language
          - Natural human conversation
          - Short sentences
          - Fast-paced dialogue
          - Small pauses (…) for realism
          - Philosophers must disagree
          - Maximum duration 30–40 seconds
          - End with audience question
 
          Structure:
          Hook -> Reaction -> Debate -> Different perspectives -> Tension -> Ending question
 
          Tone:
          Modern, Podcast style, Engaging, Viral-friendly, Philosophical but simple.
 
          Inputs:
          Philosopher 1: ${p1} ${p1Desc ? `(${p1Desc})` : ""}
          Philosopher 2: ${p2} ${p2Desc ? `(${p2Desc})` : ""}
          Topic: ${finalTopic}
          Language: ${languageName || "English"}
          ${userQuestion ? `Specific Question/Direction from the user: "${userQuestion}"` : ""}
        `;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              socialTitle: { type: Type.STRING, description: "A catchy title for social media" },
              socialDescription: { type: Type.STRING, description: "A short description for social media with SEO and hashtags" },
              dialogue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                    emotion: { type: Type.STRING, description: "One of: calm, dramatic, intense, thoughtful, confident, serious, curious, reflective, challenging, emotional" }
                  },
                  required: ["speaker", "text", "emotion"]
                }
              },
              questionForAudience: { type: Type.STRING, description: "A final question to engage the audience" }
            },
            required: ["socialTitle", "socialDescription", "dialogue", "questionForAudience"]
          }
        }
      });

      const result = JSON.parse(response.text?.trim() || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("Gemini generate-dialogue error:", error);
      res.status(500).json({ error: error.message || "Failed to generate dialogue" });
    }
  });

  app.post("/api/gemini/generate-tts", async (req, res) => {
    try {
      const { ttsPrompt, isMonologue, p1, p2, voice1, voice2 } = req.body;
      const ai = getGeminiClient();

      const validVoices = ["Charon", "Kore", "Puck", "Zephyr", "Fenrir"];
      const v1 = validVoices.includes(voice1) ? voice1 : "Charon";
      const v2 = validVoices.includes(voice2) ? voice2 : "Kore";

      const speechConfig: any = isMonologue ? {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: v1 }
        }
      } : {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: p1 || "Philosopher 1",
              voiceConfig: { prebuiltVoiceConfig: { voiceName: v1 } }
            },
            {
              speaker: p2 || "Philosopher 2",
              voiceConfig: { prebuiltVoiceConfig: { voiceName: v2 } }
            }
          ]
        }
      };

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: ttsPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: speechConfig
        }
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: "No audio generated by TTS model" });
      }

      res.json({ audioBase64: base64Audio });
    } catch (error: any) {
      console.error("Gemini generate-tts error:", error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
