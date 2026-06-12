import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { mcpTools } from "./server/tools.js";

function mapGoogleTypeToSchema(schema: any): any {
  if (!schema) return schema;
  const newSchema = { ...schema };
  if (typeof newSchema.type === 'string') newSchema.type = newSchema.type.toLowerCase();
  if (newSchema.properties) {
     for (const key in newSchema.properties) {
        newSchema.properties[key] = mapGoogleTypeToSchema(newSchema.properties[key]);
     }
  }
  if (newSchema.items) newSchema.items = mapGoogleTypeToSchema(newSchema.items);
  return newSchema;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let defaultAi: GoogleGenAI | null = null;
  if (process.env.GEMINI_API_KEY) {
    defaultAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }

  app.post("/api/chat", async (req, res) => {
    try {
      const { contents, modelConfig } = req.body;
      let currentContents = contents || [];
      const envApiUrl = process.env.LLM_BASE_URL;
      const envApiKey = process.env.LLM_API_KEY;
      const envModelId = process.env.LLM_MODEL || "claude-opus-4.8";
      
      const hasCustomUI = modelConfig && modelConfig.apiUrl && modelConfig.apiUrl.trim() !== "";
      const isCustom = hasCustomUI || (envApiUrl && envApiUrl.trim() !== "");
      
      const finalApiUrl = hasCustomUI ? modelConfig.apiUrl : envApiUrl;
      const finalApiKey = hasCustomUI ? modelConfig.apiKey : envApiKey;
      const finalModelId = hasCustomUI ? modelConfig.modelId : envModelId;
      
      const endpoint = finalApiUrl.endsWith("/chat/completions") ? finalApiUrl : finalApiUrl.replace(/\/+$/, "") + "/chat/completions";

      const SYSTEM_PROMPT = "Вы — полезный ИИ-ассистент, помогающий SEO специалистам. Следующие инструменты представляют собой подключенный MCP сервер. Предоставляйте пользователям ответы и вызывайте нужные инструменты.";

      let iteration = 0;

      while (iteration < 5) {
        iteration++;
        let responseText = "";
        let functionCalls: any[] = [];
        
        if (isCustom) {
            const openAiMessages = [{ role: "system", content: SYSTEM_PROMPT }];
            
            for (const c of currentContents) {
              if (c.role === "user" && c.parts.some((p: any) => p.text)) {
                openAiMessages.push({ role: "user", content: c.parts.map((p:any) => p.text).join("") });
              } else if (c.role === "model") {
                const textParts = c.parts?.filter((p:any)=>p.text).map((p:any)=>p.text).join("") || "";
                const toolCalls = c.parts?.filter((p:any)=>p.functionCall).map((p:any)=>({
                  id: p.functionCall.id || "call_" + Math.random().toString(36).substring(7),
                  type: "function",
                  function: {
                    name: p.functionCall.name,
                    arguments: typeof p.functionCall.args === 'string' ? p.functionCall.args : JSON.stringify(p.functionCall.args)
                  }
                })) || [];
                if (textParts || toolCalls.length > 0) {
                   const msg: any = { role: "assistant" };
                   if (textParts) msg.content = textParts;
                   if (toolCalls.length > 0) msg.tool_calls = toolCalls;
                   openAiMessages.push(msg);
                }
              } else if (c.role === "user" && c.parts.some((p:any) => p.functionResponse)) {
                 for (const p of c.parts) {
                   if (p.functionResponse) {
                     openAiMessages.push({
                       role: "tool",
                       tool_call_id: p.functionResponse.id,
                       name: p.functionResponse.name,
                       content: typeof p.functionResponse.response === "string" ? p.functionResponse.response : JSON.stringify(p.functionResponse.response)
                     } as any);
                   }
                 }
              }
            }
            
            const openAiTools = mcpTools.map((t: any) => ({
               type: "function",
               function: {
                 name: t.name,
                 description: t.description,
                 parameters: mapGoogleTypeToSchema(t.parameters) || { type: "object", properties: {}, additionalProperties: false }
               }
            }));
  
            const response = await fetch(endpoint, {
               method: "POST",
               headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${finalApiKey}`
               },
               body: JSON.stringify({
                 model: finalModelId,
                 messages: openAiMessages,
                 tools: openAiTools,
                 tool_choice: "auto"
               })
            });
            
            if (!response.ok) {
               throw new Error(`Ошибка API API: ${response.status} - ${await response.text()}`);
            }
            
            const data = await response.json();
            const message = data.choices[0].message;
            responseText = message.content || "";
            if (message.tool_calls && message.tool_calls.length > 0) {
              functionCalls = message.tool_calls.map((tc: any) => {
                let parsedArgs = {};
                try { parsedArgs = JSON.parse(tc.function.arguments || "{}"); } catch(e) {}
                return { id: tc.id, name: tc.function.name, args: parsedArgs };
              });
            }
        } else {
            if (!defaultAi) {
              return res.status(500).json({ error: "API ключ Gemini не настроен. Добавьте свою модель в настройках." });
            }
            const response = await defaultAi.models.generateContent({
              model: modelConfig?.modelId && modelConfig.modelId !== "gemini-3.5-flash" ? modelConfig.modelId : "gemini-3.5-flash",
              contents: currentContents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                tools: [{ functionDeclarations: mcpTools }],
              }
            });
            
            responseText = response.text || "";
            if (response.functionCalls && response.functionCalls.length > 0) {
              functionCalls = response.functionCalls;
            }
        }

        let modelMessage = { role: "model", parts: [] as any[] };
        if (responseText) modelMessage.parts.push({ text: responseText });

        if (functionCalls.length > 0) {
          currentContents.push({
             role: "model",
             parts: functionCalls.map(c => ({
               functionCall: { id: c.id || "call_" + Math.random().toString(36).substring(7), name: c.name, args: c.args }
             }))
          });

          const toolResponses = functionCalls.map(call => ({
              functionResponse: {
                id: (call.id || "call_" + Math.random().toString(36).substring(7)),
                name: call.name,
                response: { status: "success", message: `MCP Success`, data: call.args }
              }
          }));

          currentContents.push({ role: "user", parts: toolResponses });
        } else {
           if (responseText) currentContents.push(modelMessage);
           break;
        }
      }

      const latestModelMsg = currentContents.slice().reverse().find((c: any) => c.role === "model");
      const answer = latestModelMsg?.parts?.filter((p:any) => p.text).map((p:any)=>p.text).join("\n") || "";
      
      res.json({ text: answer, contents: currentContents });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(3000, "0.0.0.0", () => console.log(`Server running on port 3000`));
}

startServer();
