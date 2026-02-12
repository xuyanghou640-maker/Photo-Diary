import { supabaseUrl, publicAnonKey } from '../../utils/supabase/info';
import type { DiaryEntry } from '../components/diary-entry-form';
import { supabase } from './supabaseClient';

const API_BASE = `${supabaseUrl}/functions/v1/make-server-9fe38dad`;

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || publicAnonKey}`,
  };
}

export async function fetchEntries(): Promise<DiaryEntry[]> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}/entries`, { headers });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching entries:', error);
      throw new Error('Failed to fetch entries');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching entries:', error);
    throw error;
  }
}

export async function createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(entry),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating entry:', error);
      throw new Error('Failed to create entry');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating entry:', error);
    throw error;
  }
}

export async function updateEntry(id: string, entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(entry),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating entry:', error);
      throw new Error('Failed to update entry');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Error deleting entry:', error);
      throw new Error('Failed to delete entry');
    }
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}