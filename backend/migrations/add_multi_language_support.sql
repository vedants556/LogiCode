-- Migration to add multi-language support to questions table
-- Run this SQL script to update your database schema

ALTER TABLE questions 
ADD COLUMN selected_languages TEXT,
ADD COLUMN language_templates TEXT,
ADD COLUMN language_solutions TEXT;

-- Update existing questions to have default values
-- Using q_id (primary key) to satisfy safe update mode
UPDATE questions 
SET 
  selected_languages = '["c"]',
  language_templates = '{"c": ""}',
  language_solutions = '{"c": ""}'
WHERE q_id > 0;
