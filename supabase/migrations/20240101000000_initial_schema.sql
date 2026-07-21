-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'partner')),
  relationship TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'love', 'miss', 'excited', 'calm', 'sad')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('schedule', 'reminder', 'milestone')),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL
);

-- Letters table
CREATE TABLE IF NOT EXISTS letters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('open_when', 'love_letter', 'secret')),
  open_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vc', 'birthday', 'anniversary', 'reminder')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery-images',
  'gallery-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access for gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images'
  AND auth.uid() IN (SELECT id FROM profiles)
);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-images'
  AND auth.uid() IN (SELECT id FROM profiles)
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Moods policies
CREATE POLICY "Users can view moods from their partner"
ON moods FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT id FROM profiles WHERE role != (SELECT role FROM profiles WHERE id = user_id))
);

CREATE POLICY "Users can insert their own moods"
ON moods FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view all activities"
ON activities FOR SELECT
USING (true);

CREATE POLICY "Users can insert activities"
ON activities FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own activities"
ON activities FOR UPDATE
USING (auth.uid() = created_by);

-- Gallery policies
CREATE POLICY "Users can view all gallery items"
ON gallery FOR SELECT
USING (true);

CREATE POLICY "Users can insert gallery items"
ON gallery FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own gallery items"
ON gallery FOR DELETE
USING (auth.uid() = created_by);

-- Letters policies
CREATE POLICY "Users can view their own letters"
ON letters FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own letters"
ON letters FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Calendar events policies
CREATE POLICY "Users can view all calendar events"
ON calendar_events FOR SELECT
USING (true);

CREATE POLICY "Users can insert calendar events"
ON calendar_events FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
CREATE INDEX IF NOT EXISTS idx_gallery_created_by ON gallery(created_by);
CREATE INDEX IF NOT EXISTS idx_letters_created_by ON letters(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
