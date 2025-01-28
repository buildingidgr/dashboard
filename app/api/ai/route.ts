import { OpenAI } from 'openai';

export const runtime = 'edge';

// Check if the API key is configured
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, // Auto retry on rate limit errors
});

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create chat completion with retry
async function createChatCompletion(messages: any[], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      });
    } catch (error: any) {
      if (error.status === 429 && i < retries - 1) {
        // If rate limited and we have retries left, wait and try again
        console.log(`Rate limited, retrying in ${(i + 1) * 1000}ms...`);
        await delay((i + 1) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(req: Request) {
  try {
    // Check for authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Bearer token required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid bearer token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages } = await req.json();

    if (!messages) {
      return new Response('Missing messages in request body', { status: 400 });
    }

    const stream = await createChatCompletion(messages);

    // Convert the stream to a ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    // Return the stream with the appropriate headers
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in AI route:', error);
    
    // Handle OpenAI API errors
    if (error.status === 401) {
      return new Response(
        JSON.stringify({
          error: 'Invalid OpenAI API key. Please check your configuration.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle quota errors
    if (error.status === 429) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API rate limit exceeded. Please try again in a few moments. If you recently added funds, it may take a few minutes to process.',
        }),
        {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '30', // Suggest retry after 30 seconds
          },
        }
      );
    }

    // Handle model access errors
    if (error.message?.includes('does not exist or you do not have access to it')) {
      return new Response(
        JSON.stringify({
          error: 'The selected model is not available. Using gpt-3.5-turbo instead.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during the AI request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 