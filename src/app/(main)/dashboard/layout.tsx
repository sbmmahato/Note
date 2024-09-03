// import React from 'react';

// interface LayoutProps{
//     children: React.ReactNode;
//     params:any;
// }

// const Layout: React.FC<LayoutProps>=({children,params})=>{
//     return <main className="flex over-hidden h-screen">
//         {children}
//     </main>
// }

// export default Layout;

// import { SubscriptionModalProvider } from '@/lib/providers/subscription-modal-provider';
// import { getActiveProductsWithPrice } from '@/lib/supabase/queries';
import React from 'react';
import AppStateProvider from '@/lib/providers/state-provider';
import { SupabaseUserProvider } from '@/lib/providers/supabase-user-provider';
import { SubscriptionModalProvider } from '@/lib/providers/subscription-modal-provider';

interface LayoutProps {
  children: React.ReactNode;
  params: any;
}

const Layout: React.FC<LayoutProps> = async ({ children, params }) => {
//   const { data: products, error } = await getActiveProductsWithPrice();
//   if (error) throw new Error();
  return (
    <main className="flex over-hidden h-screen">
      {/* <SubscriptionModalProvider> */}
        <SupabaseUserProvider>{children}</SupabaseUserProvider>
        {/* </SubscriptionModalProvider> */}
    </main>
  );
};

export default Layout;