'use client';

import { useActions, useUIState } from 'ai/rsc';

import type { AI } from '../../app/action';

export function Customers({ customers }: { customers: any[] }) {
  const [, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage, getAIState } = useActions();

  return (<div className="grid gap-4 p-4 border rounded-lg bg-white">
    {JSON.stringify(getAIState())}
    <div className="grid gap-4">
      {customers.map((customer: any, i: number) => <div className="grid gap-1.5" key={`customer_${customer.id}_${i}`}>
        <h3 className="font-semibold">{customer.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
      </div>)}
    </div>
  </div>
  );
}
