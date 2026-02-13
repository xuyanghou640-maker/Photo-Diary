import { supabase } from '../utils/supabaseClient';
import { BookPage } from '../utils/layout-engine';

export interface SharedBook {
  id: string;
  user_id: string;
  year: string;
  style: string;
  pages: BookPage[];
  created_at: string;
}

export async function shareBook(year: string, style: string, pages: BookPage[]): Promise<SharedBook> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('shared_books')
    .insert({
      user_id: user.id,
      year,
      style,
      pages
    })
    .select()
    .single();

  if (error) {
    console.error('Error sharing book:', error);
    throw new Error('Failed to share book');
  }

  return data;
}

export async function getSharedBook(id: string): Promise<SharedBook> {
  const { data, error } = await supabase
    .from('shared_books')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching shared book:', error);
    throw new Error('Failed to fetch shared book');
  }

  return data;
}