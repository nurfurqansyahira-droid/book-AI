import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the GoogleGenAI instance on the server and check keys
const hasApiKey = !!process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check & status API
  app.get("/api/status", (req, res) => {
    res.json({
      configured: hasApiKey,
      status: "online",
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Blueprint outline generator
  app.post("/api/story/outline", async (req: express.Request, res: express.Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured in Secrets." });
        return;
      }

      const { premise, archetypeId, protagonist, worldSetting, customPacingPrompt } = req.body;

      if (!premise) {
        res.status(400).json({ error: "Story premise is required to generate a pacing curve." });
        return;
      }

      // Instruct model based on the selected Pacing Archetype
      let styleInstruction = "";
      let beatsCount = 8;

      if (archetypeId === "sanderson") {
        styleInstruction = "Brandon Sanderson style (The Sanderlanche / pacing storm): Deep rules-based setup in the first half, slow friction and rising geopolitical or magical tension, leading to an exponential, frantic climax where multiple separate plot threads clash and resolve simultaneously at hyper-speed.";
        beatsCount = 8;
      } else if (archetypeId === "cinematic") {
        styleInstruction = "Cinematic Fantasy Epic style: Widescreen visual setups, orchestral shifts, heavy sensory cues, sweeping battles or wonderous acts, structured in majestic high-peak rises.";
        beatsCount = 8;
      } else if (archetypeId === "cozy") {
        styleInstruction = "Cozy Low-Stakes Romance style: Slow-burn comfort, warmth, witty dialogue, local sensory details (smells of baking, tea, rain on cobblestones), emotionally safe environments where external trouble is minimal, and conflicts resolve softly.";
        beatsCount = 6;
      } else if (archetypeId === "thriller") {
        styleInstruction = "Dark Psychological Thriller style: High existential or psychological dread, claustrophobic pacing, endless cliffhangers, tight ticking clock, unreliable narrative perceptions, and sudden shocking twists.";
        beatsCount = 8;
      } else {
        styleInstruction = `Custom stylistic guide: ${customPacingPrompt || "Balanced narrative pace."}`;
        beatsCount = 7;
      }

      const prompt = `
        You are a master story architect and literary editor. 
        Create a precise chapter-by-chapter pacing outline for a story with the following parameters:
        - Core Premise: "${premise}"
        - Main Protagonist: "${protagonist || "A mysterious traveler"}"
        - World/Setting: "${worldSetting || "A rich, evocative fictional environment"}"
        - Pacing Style: "${styleInstruction}"
        
        Generate exactly ${beatsCount} sequential chapters (story beats).
        Map the "tensionLevel" (0 to 100) on each chapter to perfectly visualize a graph matching the pacing archetype:
        - For 'sanderson': Starts low (10-30), rises steadily, then goes vertical at chapter 7 and 8 (reaching 95-100).
        - For 'cinematic': High hook early (50-60), drops to recover (30), rises to middle test, then surges to a towering finish (90).
        - For 'cozy': Mild crests (20-40) focusing on emotional bonding, warm tea, cozy discoveries, peaking gently at 50, but never feeling stressful or brutal.
        - For 'thriller': Immediately high (50+), escalates with a ruthless stair-step progression, chapter 8 culminates at a mind-bending peak (95+).

        Ensure each chapter synopsis explicitly describes progress, world rules, character choices, and pacing cues relevant to "${archetypeId}". The 'writingTips' should be brief, highly creative recipes (e.g. "Use cold tactile sensory keywords" or "Establish a hard limitation of her copper metal resource").
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an analytical developmental editor specialized in commercial speculative fiction and genre pacing models. Excel at structured story blueprints.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: `A sequence of exactly ${beatsCount} story beats structure.`,
            items: {
              type: Type.OBJECT,
              properties: {
                chapterNumber: { type: Type.INTEGER },
                title: { type: Type.STRING, description: "A creative, stylistic chapter title matching the genre vibe." },
                synopsis: { type: Type.STRING, description: "Detailed 2-3 sentence description of critical story and pacing events occurring in this stage." },
                tensionLevel: { type: Type.INTEGER, description: "Tension rating from 0 to 100 representing scale of adrenaline, speed, or emotional stress." },
                focusType: { type: Type.STRING, enum: ["setup", "escalation", "climax", "cozy", "clash", "revelation"] },
                writingTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 hyper-specific direct sensory or drafting tips targeted under this style."
                }
              },
              required: ["chapterNumber", "title", "synopsis", "tensionLevel", "focusType", "writingTips"]
            }
          }
        }
      });

      const dataText = response.text;
      if (!dataText) {
        throw new Error("Failed to extract text from generator response.");
      }

      const parsedOutline = JSON.parse(dataText.trim());
      res.json({ outline: parsedOutline });

    } catch (error: any) {
      console.error("Outline error:", error);
      res.status(500).json({ error: error.message || "Trouble constructing the narrative curve." });
    }
  });

  // 3. Immersive Scene Synthesizer
  app.post("/api/story/scene", async (req: express.Request, res: express.Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
        return;
      }

      const { state, beat, temperature } = req.body;
      if (!state || !beat) {
        res.status(400).json({ error: "Missing state or beat information." });
        return;
      }

      const prompt = `
        Draft a stunning, atmospheric scene of around 300 to 450 words for:
        - Story Title: "${state.title || "The Unnamed Spindle"}"
        - Premise: "${state.premise}"
        - Protagonist: "${state.protagonist}"
        - World/Setting: "${state.worldSetting}"
        - Pacing archetype: "${state.archetypeId}"
        
        This scene corresponds to the chapter:
        - Chapter ${beat.chapterNumber}: "${beat.title}"
        - Chapter Synopsis: "${beat.synopsis}"
        - Target Tension Level: ${beat.tensionLevel}/100 (Focus Mode: ${beat.focusType})

        WRITING MANDATES:
        1. Show, Don't Tell: Avoid exposition dump. Dive straight into active situations, thoughts, or ambient interactions.
        2. Sensory Palette: Weave in physical touch, environmental moisture/temperature, sound frequencies, and smells.
        3. Match the Style Archetype:
           - Sanderson style: Focus on cause-and-effect mechanics, strict metal/power thresholds, tactical space management, and high-impact pacing.
           - Cinematic Fantasy: Focus on large scales, shimmering magical lighting, epic vistas of dust and starlight, and majestic active adjectives.
           - Cozy Romance: Soft-focus domestic items, shared silent laughter, smelling of dry cedar or brewing clover, small awkward interactions, extreme emotional warmth.
           - Dark Thriller: Cold sweats, ticking watch beats, flickering candles or shadows, staccato sentences, rapid breathing, and psychological dread.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an award-winning novelist who writes with immaculate prose control, immersive dialogue, and masterful sentence rhythm. Your prose is visceral, stylish, and free of typical generative cliche words like 'testament', 'beacon', or 'symphony of'.",
          temperature: typeof temperature === "number" ? temperature : 0.85,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prose: { type: Type.STRING, description: "The beautiful drafted story scene with immersive paragraphs, rich sensory detail, and elegant active voice." },
              pacingAnalysis: { type: Type.STRING, description: "A brief breakdown explaining how the word lengths, punctuation, and imagery match the selected pacing curve." },
              sensoryHighlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of the concrete sensory keywords used in the text to hook the reader (e.g. smell of ozone, crackle of furnace heat)."
              }
            },
            required: ["prose", "pacingAnalysis", "sensoryHighlights"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json(parsed);

    } catch (error: any) {
      console.error("Synthesizer error:", error);
      res.status(500).json({ error: error.message || "Failed to draft the prose." });
    }
  });

  // 4. Prose Style Refiner
  app.post("/api/story/refine", async (req: express.Request, res: express.Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
        return;
      }

      const { text, instruction, archetypeId } = req.body;
      if (!text || !instruction) {
        res.status(400).json({ error: "Original text and refining instruction are required." });
        return;
      }

      const prompt = `
        Polishing active draft prose of a novelist.
        
        Original Text:
        """
        ${text}
        """

        Style Tuning Directive: "${instruction}"
        Underlying Archetype Vibe: "${archetypeId}"

        INSTRUCTIONS:
        - Keep the core narrative events identical, do not write a different plot.
        - Deepen the specific mood requested:
          * If 'increase dread' or 'thriller style': shorten sentences, amplify claustrophobic focus, introduce sharp cold sensations.
          * If 'Sanderson magical rules' or 'sanderson style': clarify the resources, metal reserves, or cause-and-effect science behind whatever happens.
          * If 'witty dialog' or 'cozy style': introduce charming double-entendres, playful teasing, and a comforting warmth to descriptions.
          * If 'more cinematic': inflate the visual contrasts, light angles, and majestic vistas.
        - Refine clichés and passive verbs to active, concrete ones.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a senior line-editor and copyeditor who loves rich prose typography, rhythmic text styling, and evocative tone adjustments.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedText: { type: Type.STRING, description: "The polished and beautifully adjusted prose version." },
              changesMade: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of tactical changes or word replacements made to polish the prose."
              }
            },
            required: ["refinedText", "changesMade"]
          }
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json(parsed);

    } catch (error: any) {
      console.error("Refiner error:", error);
      res.status(500).json({ error: error.message || "Failed to polish prose." });
    }
  });

  // Vite middleware setup
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
