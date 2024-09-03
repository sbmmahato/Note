'use server';

import { z } from 'zod';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { FormSchema } from '../types';
import { cookies } from 'next/headers';
import createSupabaseServerClient from "@/lib/supabase/server";
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// export async function actionLoginUser({
//   email,
//   password,
// }: z.infer<typeof FormSchema>) {
//   const supabase = createRouteHandlerClient({ cookies });
//   const response = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });
//   return response;
// }

export async function actionLoginUser({
      email,
      password,
    }: z.infer<typeof FormSchema>){
        const supabase=await createSupabaseServerClient();

        const result=await supabase.auth.signInWithPassword({
            email,
            password
        });
        return JSON.stringify(result); //OR return JSON.stringify(result)
    }


    export async function actionSignUpUser({
        email,
        password,
      }: z.infer<typeof FormSchema>){
          const supabase=await createSupabaseServerClient();

          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email);
  
        if (data?.length) return { error: { message: 'User already exists', data } };

          const result=await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: 'http://localhost:3000/dashboard',
              },
          });
          
          return JSON.stringify(result); //OR return JSON.stringify(result)
      }