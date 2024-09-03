'use client';

import {useRouter} from 'next/navigation';
import React, {useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import * as z from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import { FormSchema } from '@/lib/types';
import {  Form,FormControl,FormDescription,FormField,FormItem,FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loader from '@/components/global/Loader';
import Link from 'next/link';
import { actionLoginUser } from '@/lib/server-action/auth-actions';

const LoginPage=()=>{
    const router=useRouter();
    const [submitError,setSubmitError]=useState('');

    const form=useForm<z.infer<typeof FormSchema>>({
        mode:'onChange',
        resolver: zodResolver(FormSchema),
        defaultValues: {email:'', password:''},
    });

    const isLoading=form.formState.isSubmitting;

    const onSubmit:SubmitHandler<z.infer<typeof FormSchema>> = async (formData)=>{
        const result=await actionLoginUser(formData);
        // console.log(result);
        const {error}=JSON.parse(result);
        if (error){
            form.reset();
            setSubmitError(error.message);
            // console.log(error.message);
        }
        router.replace('/dashboard');
    };

    return (
        <Form {...form}>
      <form
        onChange={() => {
          if (submitError) setSubmitError('');
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <FormDescription
          className="
        text-foreground/60"
        >
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>
        <FormField
          disabled={isLoading}
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          disabled={isLoading}
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {submitError && <FormMessage>{submitError}</FormMessage>}
        <Button
          type="submit"
          className="w-full p-6"
          size="lg"
          disabled={isLoading}
        >
          {!isLoading ? 'Login' : <Loader />}
        </Button>
        <span className="self-container">
          Dont have an account?{' '}
          <Link
            href="/signup"
            className="text-primary"
          >
            Sign Up
          </Link>
        </span>
      </form>
    </Form>
    )
};

export default LoginPage;