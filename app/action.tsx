import 'server-only';

import { createAI, createStreamableUI, getMutableAIState } from 'ai/rsc';
import OpenAI from 'openai';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

import {
  BotCard,
  BotMessage,
  Customers,
  spinner
} from '@/components/llm-stocks';

import { Products } from '@/components/llm-stocks/products';
import { Skeleton } from '@/components/llm-stocks/skeleton';
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
You are a CRM conversation bot and you can help users query their Stripe information, step by step.

Messages inside [] means that it's a UI element or a user event. For example:
- "[Get 10 customers]" means that an interface of the list of 10 customers with name and emails is showsn to the user.

If you want to show the list of customers, call \`list_customers\`.
If you want to show the list of products, call \`list_products\`.
If the user wants to sell stock, or complete another impossible task, respond that you are a demo and cannot do that.

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
        name: 'get_customers',
        description: 'Queries Stripe to get a list of customers.',
        parameters: z.object({
          noOfCustomers: z
            .number()
            .describe(
              'Total number of customers to return.',
            ),
          startsWith: z
            .string()
            .describe(
              'Prefix that the customer name should start with. Could be optional.',
            ),
        }).required(),
      },
      {
        name: 'get_products',
        description: 'Queries Stripe to get a list of Products.',
        parameters: z.object({
          noOfProducts: z
            .number()
            .describe(
              'Total number of products to return.',
            ),
          minPrice: z
            .number()
            .describe(
              'min price of the product',
            ),
          maxPrice: z
            .number()
            .describe(
              'max price of the product',
            ),
        }).required(),
      }
    ],
    temperature: 0,
  });

  console.log({ currentState: aiState.get() })

  completion.onTextContent((content: string, isFinal: boolean) => {
    reply.update(<BotMessage>{content}</BotMessage>);
    if (isFinal) {
      reply.done();
      aiState.done([...aiState.get(), { role: 'assistant', content }]);
    }
  });

  completion.onFunctionCall(
    'get_customers',
    async ({
      noOfCustomers,
      startsWith
    }: {
      noOfCustomers: number;
      startsWith: string;
    }) => {
      const customers = await getStripeCustomers(noOfCustomers, startsWith)

      reply.update(
        <BotCard>
          <Skeleton />
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
          name: 'get_customers',
          content: `[Got ${noOfCustomers} customers with names and emails: ${JSON.stringify(customers)}]`,
        },
      ]);
    },
  );

  completion.onFunctionCall(
    'get_products',
    async ({
      noOfProducts,
      minPrice,
      maxPrice
    }: {
      noOfProducts: number
      minPrice: number
      maxPrice: number
    }) => {
      const products = await getStripeProducts(noOfProducts, minPrice, maxPrice)

      reply.update(
        <BotCard>
          <Skeleton />
        </BotCard>,
      );

      await sleep(1000);

      reply.done(
        <BotCard>
          <Products products={products} />
        </BotCard>,
      );

      aiState.done([
        ...aiState.get(),
        {
          role: 'function',
          name: 'get_products',
          content: `[Get ${noOfProducts} products]`,
        },
      ]);
    },
  );


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
    submitUserMessage
  },
  initialUIState,
  initialAIState,
});

const getStripeCustomers = async (noOfCustomers: number, startsWith: string) => {
  console.log("user asked for ", noOfCustomers, "customers and they should start with ", startsWith)
  const customers = await stripe.customers.list()
  const customersData = customers.data

  const result = customersData.filter((customer) => customer.email?.startsWith(startsWith)).slice(0, noOfCustomers)

  return result
}


const getStripeProducts = async (noOfProducts: number, minPrice: number, maxPrice: number) => {
  console.log("user asked for ", noOfProducts, "products and they should be more than ", minPrice, "and less than ", maxPrice)
  const products = await stripe.products.list({ limit: noOfProducts, expand: ["data.default_price"] })
  const productsData = products.data

  const result = productsData.filter((product: any) => product.default_price?.unit_amount / 100 >= minPrice && product.default_price?.unit_amount / 100 <= maxPrice)

  return result
}

