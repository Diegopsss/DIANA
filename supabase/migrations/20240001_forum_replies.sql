-- Create forum_replies table for T4 (replies on experiencias)
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read replies
CREATE POLICY "Authenticated users can read replies"
  ON public.forum_replies
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own replies
CREATE POLICY "Authenticated users can insert replies"
  ON public.forum_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own replies
CREATE POLICY "Users can delete their own replies"
  ON public.forum_replies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookup by post
CREATE INDEX IF NOT EXISTS idx_forum_replies_post_id ON public.forum_replies(post_id);
