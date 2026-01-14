import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are Knowbase AI, an intelligent knowledge assistant. Your role is to help users understand complex topics, answer questions, and provide clear explanations.

Guidelines:
- Be clear, concise, and accurate
- Break down complex topics into digestible parts
- Use markdown formatting for better readability
- Include code examples when relevant (use proper syntax highlighting)
- Structure responses with headers, lists, and emphasis when appropriate
- Acknowledge uncertainty when you're not sure about something
- Provide balanced perspectives on debatable topics

When analyzing images:
- Describe what you see in detail
- Answer any questions about the image content
- Extract text if asked (OCR)
- Identify objects, people, scenes, colors, etc.
- Provide context and insights about the image

When explaining technical concepts:
- Start with a brief overview
- Break down key concepts
- Provide practical examples
- Summarize the main takeaways

Always maintain a helpful, professional, and engaging tone.`;

interface FileAttachment {
  name: string;
  type: string;
  base64: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received messages:", messages.length, "files:", files?.length || 0);

    // Process messages to include file attachments
    const processedMessages = messages.map((msg: any, index: number) => {
      // Only process the last user message for file attachments
      if (msg.role === 'user' && index === messages.length - 1 && files && files.length > 0) {
        const content: any[] = [
          { type: 'text', text: msg.content }
        ];
        
        // Add image attachments
        for (const file of files as FileAttachment[]) {
          if (file.type.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: {
                url: file.base64
              }
            });
          } else {
            // For non-image files, add as text context
            content[0].text += `\n\n[Attached file: ${file.name}]`;
          }
        }
        
        return { ...msg, content };
      }
      return msg;
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Streaming response back to client");

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
