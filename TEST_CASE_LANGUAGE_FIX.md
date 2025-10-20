# Test Case Language Filtering Fix

## Problem Description

When users submit solutions in Python, the system was running test cases from both Python and C++ versions of the same question, causing C++ test cases to fail even though the Python code was correct.

## Root Cause

The `testcases` table in the database did not have a `language` field to distinguish between test cases for different programming languages. All test cases were being retrieved regardless of the user's chosen language.

## Solution Implemented

### 1. Database Schema Update

- **File**: `backend/migrations/add_language_to_testcases.sql`
- **Changes**: Added `language` column to `testcases` table with default value 'c'
- **Indexes**: Added performance indexes for language-based filtering

### 2. Test Case Insertion Update

- **File**: `backend/index.js` (lines 535-548)
- **Changes**: Updated test case insertion to include language field
- **Code**: `INSERT INTO testcases (tno, q_id, runnercode, ip, iptype, op, optype, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`

### 3. Test Case Retrieval Filtering

- **File**: `backend/index.js`
- **Endpoints Updated**:
  - `/api/runtestcases` (lines 671-672)
  - `/api/checktc` (lines 782-783)
- **Changes**: Added `AND language = ?` filter to SQL queries

### 4. Debug Logging Added

- Added comprehensive debug logging to track test case retrieval
- Shows language, test case count, and details for troubleshooting

## Migration Instructions

### Step 1: Run Database Migration

```bash
cd backend
node run_migration.js
```

### Step 2: Update Existing Test Cases (if any)

For existing test cases without language field, they will default to 'c'. You may need to manually update them if they were created for other languages.

### Step 3: Test the Fix

1. Create a question with test cases in multiple languages (Python and C++)
2. Submit a Python solution
3. Verify that only Python test cases are executed
4. Check debug logs to confirm filtering is working

## Testing Scenarios

### Scenario 1: Python Solution

- **Input**: Python code for factorial problem
- **Expected**: Only Python test cases should run
- **Debug Output**: Should show "Retrieved test cases for language python: X total test cases"

### Scenario 2: C++ Solution

- **Input**: C++ code for factorial problem
- **Expected**: Only C++ test cases should run
- **Debug Output**: Should show "Retrieved test cases for language cpp: X total test cases"

## Files Modified

1. `backend/migrations/add_language_to_testcases.sql` (new)
2. `backend/run_migration.js` (new)
3. `backend/index.js` (updated)
4. `TEST_CASE_LANGUAGE_FIX.md` (this file)

## Debug Information

The system now logs:

- Language being used for test case execution
- Number of test cases retrieved for that language
- Details of each test case (ID, language, input, output)

## Rollback Instructions

If issues occur, you can rollback by:

1. Removing the language filter from SQL queries
2. Dropping the language column: `ALTER TABLE testcases DROP COLUMN language;`
3. Removing the language parameter from test case insertion

## Verification

After implementing the fix:

1. Check that test cases are properly filtered by language
2. Verify that Python solutions only run Python test cases
3. Verify that C++ solutions only run C++ test cases
4. Confirm that debug logs show correct filtering
