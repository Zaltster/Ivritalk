-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Worlds table
CREATE TABLE worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  storyline TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Worlds policies
CREATE POLICY "Anyone can view worlds" ON worlds
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create worlds" ON worlds
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their worlds" ON worlds
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their worlds" ON worlds
  FOR DELETE USING (auth.uid() = creator_id);

-- World members table (for collaboration)
CREATE TABLE world_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(world_id, user_id)
);

ALTER TABLE world_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view world members" ON world_members
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join worlds" ON world_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Characters table
CREATE TABLE characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  what_did_i_do TEXT NOT NULL,
  external_qualities TEXT NOT NULL,
  internal_qualities TEXT NOT NULL,
  instructions TEXT NOT NULL,
  image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published characters" ON characters
  FOR SELECT USING (published = true OR auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create characters" ON characters
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their characters" ON characters
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their characters" ON characters
  FOR DELETE USING (auth.uid() = creator_id);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages in their worlds" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM world_members
      WHERE world_members.world_id = chat_messages.world_id
      AND world_members.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM worlds
      WHERE worlds.id = chat_messages.world_id
      AND worlds.creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR character_id IS NOT NULL
  );

-- Function to automatically add creator as world member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO world_members (world_id, user_id)
  VALUES (NEW.id, NEW.creator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_world_created
  AFTER INSERT ON worlds
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add INSERT policy for profiles (needed for trigger)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);
