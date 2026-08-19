'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?message=Could not create user')
  }

  // Si se crea correctamente en auth.users, creamos el perfil en public.users
  if (authData.user) {
    try {
      await db.insert(users).values({
        id: authData.user.id,
        email: authData.user.email!,
      })
    } catch (e) {
      console.error("Error creating user profile in public.users", e)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
