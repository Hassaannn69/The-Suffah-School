# Fee Module - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1️⃣ Run Database Schema
```
Open Supabase → SQL Editor → Paste fee_generation_schema.sql → Run
```

### 2️⃣ Setup Fee Structure
```
Login → Fee Structure → Create Fee Types → Assign to Classes
```

### 3️⃣ Start Using
```
Generate Fees → Fee Collection → Record Payments
```

---

## 📍 Navigation Menu

| Menu Item | Purpose | Access |
|-----------|---------|--------|
| **Fee Structure** | Manage fee types & class assignments | Admin, Accountant |
| **Generate Fees** | Create monthly fees for students | Admin, Accountant |
| **Fee Collection** | Record payments & track balances | Admin, Accountant |

---

## ⚡ Common Tasks

### Create Fee Type
```
Fee Structure → Fee Types → Add Fee Type
→ Enter name, description, default amount
→ Check "Allow custom" if needed → Save
```

### Assign Fee to Class
```
Fee Structure → Class Fees → Select Class
→ Assign Fee → Choose fee type → Enter amount → Assign
```

### Generate Monthly Fees
```
Generate Fees → Select month → Choose target
→ Preview → Generate Fees
```

### Record Payment
```
Fee Collection → Search student → Click "Collect"
→ Enter amount, date, method → Record Payment
```

---

## 💰 Payment Methods

- Cash
- Bank Transfer
- JazzCash
- EasyPaisa
- Cheque
- Other

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **Paid** | Green | Fully paid |
| **Partial** | Yellow | Partially paid |
| **Unpaid** | Red | Not paid |

---

## 🔍 Search & Filter

**Search**: Student name or roll number  
**Filters**: Class, Month, Status

---

## 📊 Dashboard Stats

1. **Total Fees** - All generated fees
2. **Collected** - Amount received
3. **Pending** - Outstanding balance
4. **Collection Rate** - % collected

---

## 🌙 Dark Mode

Toggle: Click moon/sun icon in header  
Auto-saves preference

---

## ⚠️ Important Rules

✅ **DO:**
- Generate fees at start of month
- Record payments immediately
- Use preview before generating
- Check stats regularly

❌ **DON'T:**
- Regenerate without checking
- Delete fee types in use
- Record payments without verification

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't generate fees | Run database schema first |
| Payment not updating | Refresh page, check triggers |
| Stats showing zero | Generate fees first |
| Menu item missing | Check user role |

---

## 📱 Keyboard Shortcuts

- `Ctrl + F` - Focus search
- `Esc` - Close modal
- `Enter` - Submit form

---

## 🔐 User Roles

| Role | Can Do |
|------|--------|
| **Admin** | Everything |
| **Accountant** | All fee operations |
| **Teacher** | View only |
| **Student** | View own fees only |

---

## 📞 Need Help?

1. Check `FEE_MODULE_GUIDE.md` for detailed instructions
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Press F12 to see browser console errors
4. Verify database schema is installed

---

## ✅ Daily Workflow

**Morning:**
1. Check pending fees
2. Review collection stats

**During Day:**
3. Record payments as received
4. Update custom amounts if needed

**End of Day:**
5. Verify all payments recorded
6. Check collection rate

**Monthly:**
7. Generate next month's fees
8. Review defaulters
9. Send reminders

---

**Print this card and keep it handy! 📌**
