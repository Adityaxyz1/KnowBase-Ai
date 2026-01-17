import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FileAttachment {
  name: string;
  type: string;
  base64: string;
  pdfText?: string;
  pdfPageCount?: number;
}

interface UserPreferences {
  preferred_learning_style?: string;
  preferred_examples?: string;
  difficulty_preference?: string;
  gamification_enabled?: boolean;
}

interface LearningContext {
  quiz_accuracy?: number;
  engagement_score?: number;
  topic?: string;
  difficulty_level?: string;
}

const buildSystemPrompt = (userPreferences?: UserPreferences, learningContext?: LearningContext) => {
  let systemPrompt = `You are Knowbase AI, an intelligent, adaptive learning assistant. You provide personalized education that adapts to each learner's needs, preferences, and pace.

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

  if (userPreferences) {
    const { preferred_learning_style, preferred_examples, difficulty_preference, gamification_enabled } = userPreferences;
    
    systemPrompt += `\n\n**User Learning Preferences:**
- Learning Style: ${preferred_learning_style || 'textual'} (adjust explanations accordingly - use more ${preferred_learning_style === 'visual' ? 'diagrams, charts, and visual descriptions' : preferred_learning_style === 'practical' ? 'hands-on examples and exercises' : 'clear textual explanations'})
- Example Preferences: ${preferred_examples || 'general'} (use relatable examples from ${preferred_examples === 'sports' ? 'sports like cricket, football' : preferred_examples === 'technology' ? 'technology and computing' : preferred_examples === 'daily_life' ? 'everyday life situations' : 'various domains'})
- Difficulty Level: ${difficulty_preference || 'adaptive'}
${gamification_enabled ? '- Include gamification elements like points, achievements, and progress indicators when appropriate' : ''}`;
  }

  if (learningContext) {
    systemPrompt += `\n\n**Learner Analytics:**
- Recent Quiz Accuracy: ${learningContext.quiz_accuracy ?? 'N/A'}%
- Engagement Level: ${learningContext.engagement_score ?? 'N/A'}/100
- Current Topic: ${learningContext.topic || 'General'}
- Recommended Difficulty: ${learningContext.difficulty_level || 'medium'}

Adapt your responses based on these metrics. If accuracy is low, simplify explanations. If engagement is dropping, make content more interactive.`;
  }

  return systemPrompt;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files, generateImage, userPreferences, learningContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received messages:", messages?.length || 0, "files:", files?.length || 0, "generateImage:", !!generateImage);

    // Handle image generation request
    if (generateImage) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            { role: "user", content: generateImage.prompt }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "Failed to generate image" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      const textResponse = data.choices?.[0]?.message?.content;

      return new Response(JSON.stringify({ 
        imageUrl, 
        textResponse,
        type: 'image'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt(userPreferences, learningContext);

    // Process messages to include file attachments
    const processedMessages = messages.map((msg: any, index: number) => {
      if (msg.role === 'user' && index === messages.length - 1 && files && files.length > 0) {
        const content: any[] = [];
        let textContent = msg.content;
        
        for (const file of files as FileAttachment[]) {
          if (file.pdfText) {
            textContent += `\n\n[PDF Document: ${file.name} (${file.pdfPageCount} pages)]\n${file.pdfText}`;
          } else if (file.type.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: {
                url: file.base64
              }
            });
          } else {
            textContent += `\n\n[Attached file: ${file.name}]`;
          }
        }
        
        content.unshift({ type: 'text', text: textContent });
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
        model: "google/gemini-3-flash-preview",
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
