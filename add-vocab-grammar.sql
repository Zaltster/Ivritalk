-- Migration to add vocab and grammar fields to existing worlds table
ALTER TABLE worlds ADD COLUMN IF NOT EXISTS vocab TEXT;
ALTER TABLE worlds ADD COLUMN IF NOT EXISTS grammar TEXT;
