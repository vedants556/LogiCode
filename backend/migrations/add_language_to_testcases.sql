-- Migration to add language support to testcases table
-- This fixes the issue where test cases from different languages are mixed together

ALTER TABLE testcases 
ADD COLUMN language VARCHAR(50) DEFAULT 'c';

-- Update existing test cases to have default language
-- Using t_id (primary key) to satisfy safe update mode
UPDATE testcases 
SET language = 'c' 
WHERE t_id > 0 AND (language IS NULL OR language = '');

-- Add index for better performance when filtering by language
CREATE INDEX idx_testcases_language ON testcases(language);
CREATE INDEX idx_testcases_qid_language ON testcases(q_id, language);
