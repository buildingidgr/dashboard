import { OpenAI } from 'openai';

export const runtime = 'edge';
export const maxDuration = 30;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create chat completion with retry
async function createChatCompletion(messages: any[], apiKey: string, retries = 3) {
  const openai = new OpenAI({
    apiKey,
    maxRetries: 3,
  });

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} to create chat completion`);
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      });
      console.log('Chat completion created successfully');
      return completion;
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error);
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
    // Check for OpenAI API key at runtime
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

    const response = await createChatCompletion(messages, apiKey);

    // Create a ReadableStream from the OpenAI response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Stream start: Creating chat completion');
          let promptTokens = 0;
          let completionTokens = 0;
          
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // Send content chunk with 0: prefix
              controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(content)}\n`));
              completionTokens++;
            }
          }

          // Send the finish events with e: and d: prefixes
          const usage = {
            promptTokens,
            completionTokens
          };

          const eventFinish = {
            finishReason: "stop",
            usage,
            isContinued: false
          };
          controller.enqueue(new TextEncoder().encode(`e:${JSON.stringify(eventFinish)}\n`));

          const dataFinish = {
            finishReason: "stop",
            usage
          };
          controller.enqueue(new TextEncoder().encode(`d:${JSON.stringify(dataFinish)}\n`));
          
          console.log('Closing stream controller');
          controller.close();
        } catch (error) {
          console.error('Stream error details:', error);
          // Send error with e: prefix
          const errorEvent = {
            finishReason: "error",
            error: error instanceof Error ? error.message : 'An error occurred'
          };
          controller.enqueue(new TextEncoder().encode(`e:${JSON.stringify(errorEvent)}\n`));
          controller.close();
        }
      }
    });

    // Return the stream with the appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain', // Changed to text/plain as per Plate.js example
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
          error: 'OpenAI API rate limit exceeded. Please try again in a few moments.',
        }),
        {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '30',
          },
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