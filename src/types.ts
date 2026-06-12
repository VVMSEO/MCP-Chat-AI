export interface ContentPart {
  text?: string;
  functionCall?: {
    id?: string;
    name: string;
    args: any;
  };
  functionResponse?: {
    id?: string;
    name: string;
    response: any;
  };
}

export interface Content {
  role: "user" | "model" | "function";
  parts: ContentPart[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  isSending?: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  apiUrl: string;
  modelId: string;
  apiKey: string;
  mcpUrl?: string;
}
