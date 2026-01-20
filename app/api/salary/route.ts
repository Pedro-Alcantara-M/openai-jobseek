import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env["NEXT_OPEN_AI_KEY"],
});

export async function POST(req: Request) {
  const { text } = await req.json();

  const stream = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: "You are a salary estimation expert for remote jobs",
      },
      {
        role: "user",
        content: `
    Based on this job posting, estimate:
    1. Expected annual salary range
    2. Experience level
    3. Location
    4 Explanation
    
    Job posting:
    site:${text}`,
      },
    ],
  });

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          const content = event.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        "Cache-Control": "no-cache",
        'Transfer-Encoding': "chunked"
      },
    }
  );
}
