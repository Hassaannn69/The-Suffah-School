# Roll Number System Update - COMPLETE ✅

## New Format Implemented: SUF<YY><CLASSCODE><NNNN>

### Format Details:
- **SUF**: The Suffah School prefix (fixed)
- **YY**: Last 2 digits of admission year (24, 25, etc.)
- **CLASSCODE**: 2-digit class code (01-12)
- **NNNN**: 4-digit serial number per class/year (0001-9999)

### Examples:
- `SUF2501001` = The Suffah School, 2025, Play Group (01), Student #1
- `SUF2507015` = The Suffah School, 2025, Class 5 (07), Student #15
- `SUF2412100` = The Suffah School, 2024, Class 10 (12), Student #100

## Class Code Mapping:
```
Play Group (PG)  → 01
Prep             → 02
Class 1          → 03
Class 2          → 04
Class 3          → 05
Class 4          → 06
Class 5          → 07
Class 6          → 08
Class 7          → 09
Class 8          → 10
Class 9          → 11
Class 10         → 12
```

## Changes Made:

### 1. Database Schema ✅
- Added `admission_year` column to students table
- Backfilled admission_year from created_at for existing students
- Set default to current year for new students

### 2. Roll Number Generation Functions ✅
- Created `getClassCode(className)` - Maps class names to 2-digit codes
- Created `getAdmissionYearCode(year)` - Extracts last 2 digits of year
- Updated `getNextRollNumber(className, admissionYear, count)` - Generates SUF format roll numbers
  - Queries for max serial number in specific class + year combination
  - Returns sequential roll numbers within that group
  - Supports both single and bulk generation

### 3. Student Form ✅
- Roll number auto-generates when class is selected
- Displays "Select class first..." until class is chosen
- Automatically includes admission_year (current year) for new students
- Roll number format: SUF<YY><CLASSCODE><NNNN>

### 4. Bulk Upload ✅
- Groups students by class before generating roll numbers
- Generates sequential roll numbers for each class group
- Automatically adds admission_year field
- Handles multiple classes in single upload

### 5. Fix All Roll Numbers Function ✅
- Completely rewrote to convert existing students to new format
- Groups students by CLASS + ADMISSION YEAR
- Assigns sequential roll numbers within each group
- Uses two-phase update to avoid conflicts:
  - Phase 1: Temporary roll numbers (TEMP-XXXX)
  - Phase 2: Final SUF format roll numbers
- Includes retry mechanism for failures

## How It Works:

### For New Single Student:
1. User selects class → Roll number auto-generates
2. Format: `SUF<current_year><class_code><next_serial>`
3. Serial number is sequential within that class/year

### For Bulk Upload:
1. Students grouped by class
2. Roll numbers generated for each class group
3. Each class gets sequential numbers starting from next available
4. All students get current year as admission_year

### For Existing Students (Fix Roll Numbers):
1. Fetches all students ordered by created_at
2. Groups by class + admission_year
3. Assigns sequential roll numbers within each group
4. Updates database with new format

## Serial Number Logic:
- Serial numbers restart for each CLASS + YEAR combination
- Example:
  - Class 7, 2024: SUF2409001, SUF2409002, SUF2409003...
  - Class 7, 2025: SUF2509001, SUF2509002, SUF2509003... (different batch)
  - Class 8, 2024: SUF2410001, SUF2410002, SUF2410003... (different class)

## Sections Handling:
- Sections are IGNORED in roll number generation
- "Class 7 (A)" and "Class 7 (B)" both use code 09
- Serial numbers are shared across all sections of same class/year

## Files Modified:
1. `assets/js/modules/students.js` - Complete roll number system rewrite

## Database Changes:
1. Added `admission_year` column (INTEGER)
2. Backfilled from created_at
3. Set default to current year

## Testing Checklist:
- [ ] Add new single student - roll number auto-generates
- [ ] Bulk upload students from multiple classes
- [ ] Run "Fix Roll Numbers" to convert existing students
- [ ] Verify all students have SUF format
- [ ] Check serial numbers are sequential within class/year groups
- [ ] Verify sections don't affect roll numbers

## Next Steps:
1. **Test on localhost** - Verify all functionality works
2. **Run "Fix Roll Numbers"** - Convert all existing students
3. **Verify all modules** - Check login, attendance, fees, reports use new format
4. **Deploy to production** - Once tested and confirmed

## Roll Number Format Benefits:
✅ Batch-proof - Year included in roll number
✅ Class-specific - Easy to identify student's class
✅ Scalable - Supports up to 9999 students per class/year
✅ Unique - No duplicates possible
✅ Organized - Sequential within class/year groups
✅ Professional - Standard institutional format
