# 🚀 Fee Module - Installation & Setup Guide

## ⏱️ Estimated Time: 10-15 minutes

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Access to Supabase Dashboard
- ✅ Admin/Accountant login credentials
- ✅ Modern web browser (Chrome, Firefox, Edge)
- ✅ Internet connection

---

## 🎯 Installation Steps

### Step 1: Database Setup (5 minutes)

#### 1.1 Open Supabase Dashboard
```
1. Go to https://supabase.com
2. Login to your account
3. Select your project
```

#### 1.2 Navigate to SQL Editor
```
1. Click "SQL Editor" in left sidebar
2. Click "New query"
```

#### 1.3 Run Database Schema
```
1. Open file: fee_generation_schema.sql
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor (Ctrl+V)
4. Click "Run" button
5. Wait for completion (should take 2-3 seconds)
```

#### 1.4 Verify Success
You should see:
```
✅ Success. No rows returned
```

If you see errors:
- Check if tables already exist
- Verify you have admin permissions
- Try running sections individually

---

### Step 2: Application Setup (2 minutes)

#### 2.1 Clear Browser Cache
```
1. Press Ctrl+Shift+Delete
2. Select "Cached images and files"
3. Click "Clear data"
```

#### 2.2 Reload Application
```
1. Go to your application URL
2. Press Ctrl+F5 (hard reload)
3. Login with admin/accountant credentials
```

#### 2.3 Verify Menu Items
You should see these new menu items:
- ✅ Fee Collection
- ✅ Generate Fees
- ✅ Fee Structure

---

### Step 3: Initial Configuration (5 minutes)

#### 3.1 Create Fee Types

**Navigate to:** Fee Structure → Fee Types tab

**Create these common fee types:**

1. **Tuition Fee**
   ```
   Name: Tuition Fee
   Description: Monthly tuition charges
   Default Amount: 5000
   ✓ Allow custom amount
   ```

2. **Transport Fee**
   ```
   Name: Transport Fee
   Description: School bus charges
   Default Amount: 1000
   ✓ Allow custom amount
   ```

3. **Lab Fee**
   ```
   Name: Lab Fee
   Description: Laboratory charges
   Default Amount: 500
   ✓ Allow custom amount
   ```

4. **Exam Fee**
   ```
   Name: Exam Fee
   Description: Examination charges
   Default Amount: 300
   ✓ Allow custom amount
   ```

**Click "Save" for each**

---

#### 3.2 Assign Fees to Classes

**Navigate to:** Fee Structure → Class Fees tab

**For each class:**

Example for "Class 10":
```
1. Click "Class 10" in left sidebar
2. Click "Assign Fee"
3. Select "Tuition Fee" → Amount: 6000 → Assign
4. Click "Assign Fee"
5. Select "Transport Fee" → Amount: 1200 → Assign
6. Click "Assign Fee"
7. Select "Lab Fee" → Amount: 600 → Assign
```

Repeat for all classes with appropriate amounts.

---

### Step 4: Generate First Fees (3 minutes)

#### 4.1 Navigate to Fee Generation
```
Click "Generate Fees" in sidebar
```

#### 4.2 Generate Current Month Fees
```
1. Select current month (e.g., 2024-12)
2. Choose "All Students"
3. Click "Preview"
4. Review the preview table
5. Click "Generate Fees"
6. Wait for success message
```

**Expected Result:**
```
✅ Successfully generated XXX fee records for YYY students!
```

---

### Step 5: Test Payment Collection (2 minutes)

#### 5.1 Navigate to Fee Collection
```
Click "Fee Collection" in sidebar
```

#### 5.2 Verify Dashboard Stats
You should see:
- Total Fees: $XXX (sum of all generated fees)
- Collected: $0 (no payments yet)
- Pending: $XXX (same as total)
- Collection Rate: 0%

#### 5.3 Record Test Payment
```
1. Find any student in the table
2. Click "Collect" button
3. Payment modal opens
4. Verify details are correct
5. Amount: (leave as is for full payment)
6. Payment Date: (today's date)
7. Payment Method: Cash
8. Notes: "Test payment"
9. Click "Record Payment"
```

**Expected Result:**
```
✅ Payment recorded successfully!
```

#### 5.4 Verify Update
- Fee status should change to "PAID" (green)
- Dashboard stats should update
- Balance should show $0.00

---

## ✅ Verification Checklist

After installation, verify:

### Database
- [ ] fee_payments table exists
- [ ] fees table has new columns (paid_amount, final_amount, etc.)
- [ ] fee_types table has new columns (default_amount, allow_custom)
- [ ] Triggers are active
- [ ] RLS policies are enabled

### Frontend
- [ ] "Fee Collection" menu item visible
- [ ] "Generate Fees" menu item visible
- [ ] "Fee Structure" menu item visible
- [ ] All pages load without errors
- [ ] Dark mode toggle works

### Functionality
- [ ] Can create fee types
- [ ] Can assign fees to classes
- [ ] Can generate monthly fees
- [ ] Can record payments
- [ ] Stats update in real-time
- [ ] Search and filters work
- [ ] Payment history displays

---

## 🎓 First Time Usage

### Daily Workflow

**Morning (5 minutes):**
```
1. Login to application
2. Go to "Fee Collection"
3. Review dashboard stats
4. Check pending fees
```

**During Day (as needed):**
```
1. Search for student
2. Click "Collect"
3. Enter payment details
4. Record payment
5. Repeat for each payment
```

**Monthly (10 minutes):**
```
1. Go to "Generate Fees"
2. Select next month
3. Preview fees
4. Generate for all students
```

---

## 🐛 Troubleshooting

### Issue: Menu items not showing

**Solution:**
```
1. Check user role (must be admin or accountant)
2. Clear browser cache
3. Hard reload (Ctrl+F5)
4. Check browser console for errors (F12)
```

### Issue: Database errors when generating fees

**Solution:**
```
1. Verify schema SQL ran successfully
2. Check Supabase logs
3. Ensure fee types are created
4. Ensure fees are assigned to classes
```

### Issue: Payment not updating

**Solution:**
```
1. Check internet connection
2. Verify triggers are active in Supabase
3. Refresh the page
4. Check browser console for errors
```

### Issue: Stats showing zero

**Solution:**
```
1. Generate some fees first
2. Record at least one payment
3. Refresh the page
4. Check if fees table has data
```

---

## 📞 Getting Help

### Check Documentation:
1. **FEE_MODULE_GUIDE.md** - Complete feature guide
2. **IMPLEMENTATION_SUMMARY.md** - Technical details
3. **FEE_MODULE_QUICK_REFERENCE.md** - Quick tips

### Debug Steps:
1. Open browser console (F12)
2. Look for red error messages
3. Check Network tab for failed requests
4. Verify Supabase connection

### Common Error Messages:

**"Error fetching fees"**
- Check internet connection
- Verify Supabase is running
- Check RLS policies

**"Error recording payment"**
- Verify amount is valid
- Check payment date is not future
- Ensure fee exists

**"Module not found"**
- Clear cache and reload
- Check file exists in assets/js/modules/
- Verify import statements

---

## 🎉 Success!

If you can:
- ✅ See all menu items
- ✅ Create fee types
- ✅ Generate fees
- ✅ Record payments
- ✅ See updated stats

**Congratulations! Your Fee Module is fully operational! 🚀**

---

## 📊 Next Steps

### Recommended Actions:

1. **Setup All Fee Types**
   - Create all fee types your school uses
   - Set appropriate default amounts

2. **Configure All Classes**
   - Assign fees to each class
   - Set class-specific amounts

3. **Generate Current Month**
   - Generate fees for current month
   - Verify all students have fees

4. **Train Staff**
   - Show accountants how to record payments
   - Demonstrate search and filter features
   - Explain payment methods

5. **Monitor Daily**
   - Check collection rates
   - Follow up on pending fees
   - Record payments promptly

---

## 🔄 Monthly Routine

**At Start of Month:**
```
1. Generate fees for new month
2. Send reminders to students
3. Review previous month's collection
```

**During Month:**
```
1. Record payments daily
2. Monitor collection rate
3. Follow up on defaulters
```

**End of Month:**
```
1. Generate collection report
2. Review pending fees
3. Prepare for next month
```

---

## 💡 Pro Tips

1. **Use Preview**: Always preview before generating fees
2. **Record Immediately**: Record payments as soon as received
3. **Check Stats Daily**: Monitor collection rate regularly
4. **Use Filters**: Use filters to find specific students quickly
5. **Dark Mode**: Toggle dark mode for comfortable viewing
6. **Backup Data**: Regular database backups recommended

---

## 📈 Performance Tips

- Generate fees during off-peak hours
- Use filters to reduce data load
- Clear old payment history periodically
- Archive old fee records annually

---

**Installation Complete! Happy Fee Managing! 🎊**

For detailed feature usage, refer to **FEE_MODULE_GUIDE.md**
