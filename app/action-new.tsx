import 'server-only';

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import OpenAI from 'openai';

import {
  BotCard,
  BotMessage,
  Customers,
  spinner
} from '@/components/llm-stocks';

import { StocksSkeleton } from '@/components/llm-stocks/stocks-skeleton';
import {
  runOpenAICompletion,
  sleep
} from '@/lib/utils';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();
  aiState.update([
    ...aiState.get(),
    {
      role: 'user',
      content,
    },
  ]);

  const reply = createStreamableUI(
    <BotMessage className="items-center">{spinner}</BotMessage>,
  );

  const completion = runOpenAICompletion(openai, {
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `\
You are a CRM conversation bot and you can help users query their data from Stripe. You and the user can discuss and the user can request to create new queries or refine existing ones, in the UI.


Messages inside [] means that it's a UI element or a user event. For example:
  - "[Results for query: query with format: format and title: title and description: description. with data" means that a chart/table/number card is shown to that user.
        
  Keep the properties. prefix and the quotes around the property names when referring to properties.
  Keep the quotes around the event names when referring to events.
  
  The current time is ${new Date().toISOString()}.

  Feel free to be creative with suggesting queries and follow ups based on what you think. Keep responses short and to the point.

Messages inside [] means that it's a UI element or a user event.

If you want to show recent customers, call \`list_customers\`.
If the user wants to complete another impossible task, respond that you are a demo and cannot do that.

Besides that, you can also chat with users and do some calculations if needed.`,
      },
      ...aiState.get().map((info: any) => ({
        role: info.role,
        content: info.content,
        name: info.name,
      })),
    ],
    functions: [
      {
        name: 'list_customers',
        description: 'List three most recent customers from stripe with names and emails.',
        parameters: z.object({
          customers: z.array(
            z.object({
              name: z.string().describe('The name of the customer'),
              email: z.string().describe('The email of the customer'),
            }),
          ),
        }),
      },
    ],
    temperature: 0,
  });

  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(<BotMessage>{content}</BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);
    }
  });

  completion.onFunctionCall('list_customers', async ({ customers }) => {
    reply.update(
      <BotCard>
        <StocksSkeleton />
      </BotCard>,
    );

    await sleep(1000);

    reply.done(
      <BotCard>
        <Customers customers={customers} />
      </BotCard>,
    );

    aiState.done([
      ...aiState.get(),
      {
        role: 'function',
        name: 'list_customers',
        content: JSON.stringify(customers),
      },
    ]);
  });

  return {
    id: Date.now(),
    display: reply.value,
  };
}

// Define necessary types and create the AI.

const initialAIState: {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  id?: string;
  name?: string;
}[] = [];

const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
  },
  initialUIState,
  initialAIState,
});
