// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

declare const Deno: any;

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Bucket name for photo storage
const BUCKET_NAME = 'make-9fe38dad-photos';

// Create bucket on startup if it doesn't exist
async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: false });
      console.log(`Created bucket: ${BUCKET_NAME}`);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

initializeStorage();

// Helper to get user from auth header
async function getUser(c: any) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return user;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-9fe38dad/health", (c) => {
  return c.json({ status: "ok" });
});

// Get all diary entries for the authenticated user
app.get("/make-server-9fe38dad/entries", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prefix = `diary:${user.id}:`;
    const entries = await kv.getByPrefix(prefix);
    
    // Get signed URLs for photos
    const entriesWithSignedUrls = await Promise.all(
      entries.map(async (entry) => {
        if (entry.photoPath) {
          const { data } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(entry.photoPath, 3600); // 1 hour expiry
          
          return {
            ...entry,
            photo: data?.signedUrl || entry.photo,
          };
        }
        return entry;
      })
    );
    
    return c.json(entriesWithSignedUrls);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return c.json({ error: 'Failed to fetch entries' }, 500);
  }
});

// Create a new diary entry for the authenticated user
app.post("/make-server-9fe38dad/entries", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { photo, caption, mood, date, location, tags, aiTags, palette } = body;

    if (!photo || !caption || !mood) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const timestamp = Date.now();
    const entryId = `diary:${user.id}:${timestamp}`;
    
    // Upload photo to Supabase Storage
    let photoPath = '';
    if (photo.startsWith('data:image')) {
      // Convert base64 to blob
      const base64Data = photo.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const contentType = photo.split(';')[0].split(':')[1];
      
      const fileName = `${user.id}/${timestamp}_${Math.random().toString(36).substring(7)}.${contentType.split('/')[1]}`;
      photoPath = fileName;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, binaryData, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return c.json({ error: 'Failed to upload photo' }, 500);
      }
    }

    // Store entry metadata in KV store
    const entry = {
      id: timestamp.toString(), // Keep ID simple for frontend
      date: date || new Date().toISOString(),
      caption,
      mood,
      photoPath,
      location,
      tags: tags || [],
      aiTags: aiTags || [],
      palette: palette || null,
    };

    await kv.set(entryId, entry);

    // Get signed URL for response
    const { data } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(photoPath, 3600);

    return c.json({
      ...entry,
      photo: data?.signedUrl || '',
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    return c.json({ error: 'Failed to create entry' }, 500);
  }
});

// Update a diary entry for the authenticated user
app.put("/make-server-9fe38dad/entries/:id", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const entryKey = `diary:${user.id}:${id}`;
    
    // Get existing entry to check ownership and photo
    const existingEntry = await kv.get(entryKey);
    if (!existingEntry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    const body = await c.req.json();
    const { photo, caption, mood, date, location, tags, aiTags, palette } = body;

    if (!caption || !mood) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    let photoPath = existingEntry.photoPath;

    // Check if photo has changed (is base64)
    if (photo && photo.startsWith('data:image')) {
      // Delete old photo if it exists
      if (photoPath) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove([photoPath]);
      }

      // Convert base64 to blob
      const base64Data = photo.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const contentType = photo.split(';')[0].split(':')[1];
      
      const fileName = `${user.id}/${id}_${Math.random().toString(36).substring(7)}.${contentType.split('/')[1]}`;
      photoPath = fileName;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, binaryData, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        return c.json({ error: 'Failed to upload photo' }, 500);
      }
    }

    // Update entry metadata in KV store
    const entry = {
      id: id,
      date: date || existingEntry.date,
      caption,
      mood,
      photoPath,
      location: location || existingEntry.location,
      tags: tags !== undefined ? tags : (existingEntry.tags || []),
      aiTags: aiTags !== undefined ? aiTags : (existingEntry.aiTags || []),
      palette: palette !== undefined ? palette : (existingEntry.palette || null),
    };

    await kv.set(entryKey, entry);

    // Get signed URL for response
    let signedUrl = '';
    if (photoPath) {
      const { data } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(photoPath, 3600);
      signedUrl = data?.signedUrl || '';
    }

    return c.json({
      ...entry,
      photo: signedUrl || photo, // Return signed URL or original if no path (should be path usually)
    });
  } catch (error) {
    console.error('Error updating entry:', error);
    return c.json({ error: 'Failed to update entry' }, 500);
  }
});

// Delete a diary entry for the authenticated user
app.delete("/make-server-9fe38dad/entries/:id", async (c) => {
  try {
    const user = await getUser(c);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const entryKey = `diary:${user.id}:${id}`;
    
    // Get entry to find photo path
    const entry = await kv.get(entryKey);
    
    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // Delete photo from storage
    if (entry.photoPath) {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([entry.photoPath]);
    }

    // Delete entry from KV store
    await kv.del(entryKey);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ error: 'Failed to delete entry' }, 500);
  }
});

Deno.serve(app.fetch);