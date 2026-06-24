import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const getUser = async () => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  await supabase.auth.signOut()
}
