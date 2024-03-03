'use client';

import { useActions, useUIState } from 'ai/rsc';

import type { AI } from '../../app/action';

export function Products({ products }: { products: any[] }) {
  const [, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions();

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6 p-2">
      {products.map((product: any, i: number) => {
        return <div key={`product_${product.name}_${i}`} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4">
            <h3 className="font-medium text-md">{product.name}</h3>
            <h4 className="text-sm">{product.default_price?.unit_amount / 100} {product.default_price?.currency}</h4>
          </div>
        </div>
      })}
    </section>




    // <div className="flex flex-col sm:flex-row text-sm gap-2 mb-4 overflow-y-scroll pb-4">
    //   <div className="grid w-full gap-4 px-4 md:gap-6 md:px-6 lg:gap-8 xl:grid-cols-2">
    //     <div className="flex flex-col gap-1">
    //       <h1 className="text-2xl font-bold">products</h1>
    //       <p className="text-sm leading-none text-gray-500 dark:text-gray-400">
    //         Here are your products' names.
    //       </p>
    //     </div>
    //     <div className="grid gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
    //       {products.map((product: any, i: number) => {
    //         console.log(product)
    //         return <div className="grid gap-1 text-sm" key={`product_${product.name}_${i}`}>
    //           <Link className="font-semibold" href="#">
    //             {product.name}
    //           </Link>
    //           <p>{product.default_price?.unit_amount / 100} {product.default_price?.currency}</p>
    //         </div>
    //       })}
    //     </div>
    //   </div>
    // </div>
  );
}
