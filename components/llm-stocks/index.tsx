'use client';

import dynamic from 'next/dynamic';
import { StocksSkeleton } from './stocks-skeleton';

export { BotCard, BotMessage, SystemMessage } from './message';
export { spinner } from './spinner';

// const Stock = dynamic(() => import('./stock').then(mod => mod.Stock), {
//   ssr: false,
//   loading: () => <StockSkeleton />,
// });

// const Purchase = dynamic(
//   () => import('./stock-purchase').then(mod => mod.Purchase),
//   {
//     ssr: false,
//     loading: () => (
//       <div className="bg-zinc-900 rounded-lg px-4 py-5 text-center text-xs">
//         Loading stock info...
//       </div>
//     ),
//   },
// );

const Customers = dynamic(() => import('./customers').then(mod => mod.Customers), {
  ssr: false,
  loading: () => <StocksSkeleton />,
});

// const Events = dynamic(() => import('./event').then(mod => mod.Events), {
//   ssr: false,
//   loading: () => <EventsSkeleton />,
// });

export { Customers };
