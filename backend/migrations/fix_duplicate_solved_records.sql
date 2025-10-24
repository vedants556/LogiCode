-- Migration: Fix duplicate solved records and add unique constraint
-- This migration removes duplicate entries in the solved table and adds a unique constraint

-- Step 1: Create a backup table with unique records only
CREATE TEMPORARY TABLE solved_backup AS
SELECT q_id, user_id
FROM solved
GROUP BY q_id, user_id;

-- Step 2: Clear the solved table
TRUNCATE TABLE solved;

-- Step 3: Insert back only the unique records
INSERT INTO solved (q_id, user_id)
SELECT q_id, user_id FROM solved_backup;

-- Step 4: Clean up temporary table
DROP TEMPORARY TABLE solved_backup;

-- Step 5: Add unique constraint to prevent future duplicates
-- Note: This will fail gracefully if a unique constraint already exists
ALTER TABLE solved
ADD UNIQUE KEY unique_user_problem (q_id, user_id);

