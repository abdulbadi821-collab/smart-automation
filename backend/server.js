import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Restrict CORS to FRONTEND_URL
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// Initialize Supabase Admin Client using service role key (or fallback if not set)
const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Auth Middleware: reads Bearer token, verifies via supabase.auth.getUser(token), attaches req.userId
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No bearer token provided" });
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Attach verified user and userId
    req.userId = user.id;
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

// 1. Health check - public
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Apply auth to all subsequent /api routes
app.use("/api", requireAuth);

// 2. Dashboard stats: { conversationCount, messageCount } for req.userId
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const { count: conversationCount, error: convError } = await supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.userId);

    if (convError) throw convError;

    const { count: messageCount, error: msgError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.userId);

    if (msgError) throw msgError;

    res.json({
      conversationCount: conversationCount || 0,
      messageCount: messageCount || 0,
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// 3. GET /api/conversations - user's conversations, newest first
app.get("/api/conversations", async (req, res) => {
  try {
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(conversations || []);
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// 4. POST /api/conversations - creates one, returns it
app.post("/api/conversations", async (req, res) => {
  try {
    const { title } = req.body || {};
    const conversationTitle = (title && title.trim()) || "New conversation";

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: req.userId,
        title: conversationTitle,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// 5. DELETE /api/conversations/:id - deletes it (must belong to req.userId); messages cascade
app.delete("/api/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", req.userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting conversation:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// 6. GET /api/conversations/:id/messages - full message history for conversation
app.get("/api/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;

    // Verify conversation ownership
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", req.userId)
      .single();

    if (convErr || !conv) {
      return res.status(404).json({ error: "Conversation not found or access denied" });
    }

    const { data: messages, error: msgErr } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .eq("user_id", req.userId)
      .order("created_at", { ascending: true });

    if (msgErr) throw msgErr;

    res.json(messages || []);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// 7. POST /api/conversations/:id/messages - body { question }
// Step 1: insert user's message row
// Step 2: insert assistant row with status: 'sending'
// Step 3: update assistant row to status: 'generating'
// Step 4: call Gemini with question
// Step 5: update assistant row with content and status: 'completed'
// Return finished assistant message
app.post("/api/conversations/:id/messages", async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Verify conversation ownership
    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("id", conversationId)
      .eq("user_id", req.userId)
      .single();

    if (convErr || !conv) {
      return res.status(404).json({ error: "Conversation not found or access denied" });
    }

    // Step 1: Insert user's message row
    const { data: userMsg, error: userMsgErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: req.userId,
        role: "user",
        content: question.trim(),
        status: null,
      })
      .select()
      .single();

    if (userMsgErr) throw userMsgErr;

    // Auto-update conversation title if still default
    if (conv.title === "New conversation") {
      const generatedTitle = question.trim().slice(0, 40) + (question.trim().length > 40 ? "..." : "");
      await supabase
        .from("conversations")
        .update({ title: generatedTitle })
        .eq("id", conversationId)
        .eq("user_id", req.userId);
    }

    // Step 2: Insert assistant row with status: 'sending'
    const { data: assistantMsg, error: assistantInitErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: req.userId,
        role: "assistant",
        content: "",
        status: "sending",
      })
      .select()
      .single();

    if (assistantInitErr) throw assistantInitErr;

    // Step 3: Update assistant row to status: 'generating'
    const { error: genUpdateErr } = await supabase
      .from("messages")
      .update({ status: "generating" })
      .eq("id", assistantMsg.id)
      .eq("user_id", req.userId);

    if (genUpdateErr) {
      console.warn("Warning: Failed to update status to generating:", genUpdateErr);
    }

    // Step 4: Call Gemini API using current @google/genai SDK
    let finalAnswer = "";
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY is not configured on backend");
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // First try primary model: gemini-3.1-flash-lite
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: question.trim(),
        });
        finalAnswer = response.text || "";
      } catch (primaryModelErr) {
        console.warn("Primary model gemini-3.1-flash-lite failed, falling back to gemini-2.5-flash:", primaryModelErr.message);
        // Fallback to gemini-2.5-flash
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: question.trim(),
        });
        finalAnswer = fallbackResponse.text || "";
      }
    } catch (aiErr) {
      console.error("AI Generation Error:", aiErr);
      finalAnswer = `[Error generating answer: ${aiErr.message || "Unable to reach Gemini API"}]`;
    }

    // Step 5: Update assistant row with final content and status: 'completed'
    const { data: completedAssistantMsg, error: completeErr } = await supabase
      .from("messages")
      .update({
        content: finalAnswer,
        status: "completed",
      })
      .eq("id", assistantMsg.id)
      .eq("user_id", req.userId)
      .select()
      .single();

    if (completeErr) throw completeErr;

    // Return the finished assistant message
    res.status(201).json(completedAssistantMsg);
  } catch (err) {
    console.error("Error processing message:", err);
    res.status(500).json({ error: "Failed to process message" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
