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
      // Map dialogue to Heygen video inputs
      // Heygen v2 generate takes an array of video_inputs. 
      // Each video_input is a scene.
      // Limit to 10 scenes to avoid hitting limits during testing
      const scenes = dialogue.slice(0, 10);
      
      const video_inputs = scenes.map((exchange: any) => {
        const isP1 = exchange.speaker === philosopher1;
        return {
          character: {
            type: "avatar",
            avatar_id: isP1 ? "f797e158-9a6d-4723-9246-441f04f2d1a2" : "379058b8849b4931b67484f339678170",
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
