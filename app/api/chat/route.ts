import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are Ava, Anovic's AI assistant on their website. Anovic is a full-service creative marketing agency based in Cairo, Egypt.

What Anovic offers:
1. Branding & Creative Design — logos, brand identity, guidelines, company profiles, packaging, print, visual content
2. Digital Marketing — social media management, paid ads, SEO, email marketing, lead generation, campaigns
3. Media Production — reels, photography, videography, product shoots, motion graphics, video editing
4. Outdoor Advertising — billboards, banners, flyers, brochures, signage, booth & vehicle branding
5. Public Relations — press releases, media coverage, reputation management, event PR, influencer & sponsorship work
6. Business Solutions — business plans, market research, pricing strategy, feasibility studies, growth consulting
7. Software Solutions — websites, landing pages, e-commerce, mobile apps, CRM, dashboards, automation

Contact Anovic:
- Email: business@anovic.net
- Phone: 01148000500 / 01277140013 / 01285848332
- Address: Salah Salem St., El Obour Buildings, Building No. 1, 4th Floor, Office 46, Cairo

Your rules:
- Keep replies short: 2–4 sentences max unless the user specifically asks for more detail
- Be direct, friendly, and a little witty — no corporate fog
- When someone sounds interested, guide them to the contact form on this page (scroll to #contact-us) or call/email directly
- Never invent pricing — tell them to reach out for a custom quote
- If asked something off-topic, gently steer back to how Anovic can help
- Respond in the same language the user writes in`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("Chat is not configured yet.", { status: 503 });
  }

  let messages: { role: "user" | "assistant"; content: string }[];
  try {
    const body = await request.json();
    messages = body.messages ?? [];
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  // Keep the last 12 messages to avoid runaway token usage
  const trimmed = messages.slice(-12);

  const client = new Anthropic({ apiKey });

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: trimmed,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode(
            "Something went wrong. Please email business@anovic.net directly.",
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
