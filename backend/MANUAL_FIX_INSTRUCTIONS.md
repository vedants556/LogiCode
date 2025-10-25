# Manual Fix for Duplicate Solved Records

Since you're seeing "5 / 2" and "250% completed", you have duplicate records in your `solved` table. Here's how to fix it manually:

## Option 1: Using MySQL Workbench / phpMyAdmin

1. Open your MySQL client and connect to your database
2. Copy and paste the following SQL commands **one at a time**:

### Step 1: Check for duplicates first

```sql
SELECT q_id, user_id, COUNT(*) as count 
FROM solved 
GROUP BY q_id, user_id 
HAVING count > 1;
```

This will show you all the duplicate records. If you see results, continue with the fix.

### Step 2: Create a temporary backup table

```sql
CREATE TEMPORARY TABLE solved_backup AS
SELECT q_id, user_id
FROM solved
GROUP BY q_id, user_id;
```

### Step 3: Clear the solved table

```sql
TRUNCATE TABLE solved;
```

### Step 4: Insert back only unique records

```sql
INSERT INTO solved (q_id, user_id)
SELECT q_id, user_id FROM solved_backup;
```

### Step 5: Clean up temporary table

```sql
DROP TEMPORARY TABLE solved_backup;
```

### Step 6: Add unique constraint to prevent future duplicates

```sql
ALTER TABLE solved
ADD UNIQUE KEY unique_user_problem (q_id, user_id);
```

**Note:** If you get an error saying the unique key already exists, that's fine - skip this step.

## Option 2: Run all at once

Copy and paste this entire block:

```sql
-- Create backup with unique records
CREATE TEMPORARY TABLE solved_backup AS
SELECT q_id, user_id
FROM solved
GROUP BY q_id, user_id;

-- Clear the solved table
TRUNCATE TABLE solved;

-- Insert back only unique records
INSERT INTO solved (q_id, user_id)
SELECT q_id, user_id FROM solved_backup;

-- Clean up
DROP TEMPORARY TABLE solved_backup;

-- Add unique constraint (skip if already exists)
ALTER TABLE solved
ADD UNIQUE KEY unique_user_problem (q_id, user_id);
```

## Option 3: Using MySQL Command Line

```bash
mysql -u your_username -p your_database_name

# Then paste the SQL commands from Option 2
```

## Verification

After running the fix, check if it worked:

```sql
-- Should return 0 rows (no duplicates)
SELECT q_id, user_id, COUNT(*) as count 
FROM solved 
GROUP BY q_id, user_id 
HAVING count > 1;

-- Check your stats
SELECT COUNT(*) as total_records,
       COUNT(DISTINCT CONCAT(q_id, '-', user_id)) as unique_combinations
FROM solved;
```

Both numbers should now be the same!

## After Running the Fix

1. **Restart your backend server** (if it's running)
2. **Refresh your profile page** in the browser
3. **Check the stats** - they should now be correct!

Expected result:
- If you solved 2 problems, it should show: **2 / 2 = 100%**
- Not 5 / 2 = 250%

## Troubleshooting

### "Can't DROP TABLE 'solved_backup'"
This means the temporary table was already cleaned up. Just continue.

### "Duplicate key name 'unique_user_problem'"
The unique constraint already exists. Perfect! No action needed.

### Still showing wrong counts after fix
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check the database directly:
   ```sql
   SELECT COUNT(DISTINCT q_id) as solved
   FROM solved
   WHERE user_id = YOUR_USER_ID;
   ```
3. Compare with what the profile page shows

## Need Help?

If you're not comfortable running SQL commands, you can also:
1. Use a database GUI tool (MySQL Workbench is free)
2. Ask your hosting provider to run the commands
3. Export your data, recreate the table, and import back





