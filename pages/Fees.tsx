
import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { FeeRecord, ExpenseRecord } from '../types';
import Card from '../components/ui/Card';
import { DollarSign, TrendingDown, Receipt, AlertCircle, Plus, Download, BellRing, Loader2, Calendar, CreditCard, History } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../store/useStore';

const Fees: React.FC = () => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'fees' | 'expenses'>('fees');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<Record<string, boolean>>({});

  const { addNotification } = useStore();
  const { register: registerExp, handleSubmit: submitExp, reset: resetExp } = useForm();
  const { register: registerPay, handleSubmit: submitPay, setValue: setPayValue } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
        const [feesData, expensesData] = await Promise.all([db.getFees(), db.getExpenses()]);
        setFees(feesData);
        setExpenses(expensesData);
    } catch (err) {
        console.error("Failed to load financial data", err);
        addNotification({ type: 'error', message: 'Failed to load financial data. Please refresh.' });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stats Logic
  const totalCollected = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0,0,0,0);

  // Arrears: Due date BEFORE this month AND Status != Paid
  const totalArrears = fees.filter(f => {
      const due = new Date(f.dueDate);
      return due < currentMonthStart && f.status !== 'Paid';
  }).reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);

  // Pending This Month: Due date IN this month AND Status != Paid
  const pendingThisMonth = fees.filter(f => {
      const due = new Date(f.dueDate);
      return due >= currentMonthStart && f.status !== 'Paid';
  }).reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  const handleGenerateMonthlyFees = async () => {
      if(confirm("Generate tuition fees for all students for the current month?")) {
          setProcessing(true);
          try {
            await db.generateMonthlyFees();
            await fetchData();
            addNotification({ type: 'success', message: 'Monthly fees generated successfully.' });
          } catch (e) {
            addNotification({ type: 'error', message: 'Failed to generate fees.' });
          }
          setProcessing(false);
      }
  };

  const openPaymentModal = (fee: FeeRecord) => {
      setSelectedFee(fee);
      const remaining = fee.amount - (fee.paidAmount || 0);
      setPayValue('amount', remaining);
      setIsPaymentModalOpen(true);
  };

  const handleProcessPayment = async (data: any) => {
      if (!selectedFee) return;
      const amount = parseFloat(data.amount);
      if (amount <= 0) return;

      setProcessing(true);
      try {
        await db.markFeePaid(selectedFee.id, amount, data.method);
        setIsPaymentModalOpen(false);
        setSelectedFee(null);
        await fetchData();
        addNotification({ type: 'success', message: 'Payment recorded successfully.' });
      } catch (e) {
        addNotification({ type: 'error', message: 'Payment failed to record.' });
      }
      setProcessing(false);
  };

  const handleRemind = async (feeId: string) => {
      setSendingReminder(prev => ({ ...prev, [feeId]: true }));
      try {
        await db.sendFeeReminder(feeId);
        addNotification({ type: 'success', message: 'Reminder email sent to parent.' });
      } catch (e) {
        addNotification({ type: 'error', message: 'Failed to send reminder.' });
      } finally {
        setTimeout(() => {
            setSendingReminder(prev => ({ ...prev, [feeId]: false }));
        }, 1000);
      }
  };

  const handleAddExpense = async (data: any) => {
      try {
        await db.addExpense({
            ...data,
            amount: parseFloat(data.amount),
            date: new Date().toISOString().split('T')[0]
        });
        setIsExpenseModalOpen(false);
        resetExp();
        fetchData();
        addNotification({ type: 'success', message: 'Expense recorded.' });
      } catch (e) {
        addNotification({ type: 'error', message: 'Failed to add expense.' });
      }
  };

  const openReceipt = (fee: FeeRecord) => {
      setSelectedFee(fee);
      setIsReceiptModalOpen(true);
  };

  const handleDownloadReceipt = () => {
    if (!selectedFee) return;

    try {
        // Initialize PDF - check if it's the class or default export
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185);
        doc.text("The Suffah School", 105, 20, { align: "center" });
        
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text("Payment Receipt", 105, 30, { align: "center" });

        // Line
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        doc.text(`Receipt ID: ${selectedFee.id.toUpperCase()}`, 20, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);

        doc.text(`Student Name:`, 20, 60);
        doc.setFont("helvetica", "bold");
        doc.text(selectedFee.studentName, 50, 60);
        doc.setFont("helvetica", "normal");

        doc.text(`Fee Type:`, 20, 70);
        doc.setFont("helvetica", "bold");
        doc.text(selectedFee.type, 50, 70);
        doc.setFont("helvetica", "normal");

        doc.text(`Status:`, 150, 70);
        
        // Conditional Color
        if (selectedFee.status === 'Paid') {
            doc.setTextColor(0, 128, 0); // Green
        } else {
            doc.setTextColor(255, 0, 0); // Red
        }

        doc.text(selectedFee.status, 170, 70);
        doc.setTextColor(0);

        // Table
        const tableBody = selectedFee.transactions?.map(t => [
            t.date,
            t.method,
            `$${t.amount}`
        ]) || [];

        autoTable(doc, {
            startY: 85,
            head: [['Date', 'Method', 'Amount Paid']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Totals
        doc.setFontSize(12);
        doc.text(`Total Amount Due:`, 130, finalY);
        doc.text(`$${selectedFee.amount}`, 180, finalY, { align: "right" });
        
        doc.text(`Total Paid:`, 130, finalY + 7);
        doc.text(`$${selectedFee.paidAmount || 0}`, 180, finalY + 7, { align: "right" });

        doc.setFont("helvetica", "bold");
        doc.text(`Balance:`, 130, finalY + 14);
        doc.text(`$${Math.max(0, selectedFee.amount - (selectedFee.paidAmount || 0))}`, 180, finalY + 14, { align: "right" });

        // Footer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("This is a computer generated receipt.", 105, 280, { align: "center" });

        // Save
        doc.save(`Receipt_${selectedFee.studentName}_${selectedFee.id}.pdf`);
        addNotification({ type: 'success', message: 'Receipt downloaded successfully.' });
    } catch (err) {
        console.error("PDF Generation Error:", err);
        addNotification({ type: 'error', message: 'Failed to generate PDF. See console.' });
    }
  };

  const chartData = [
      { name: 'Jan', income: 4000, expense: 2400 },
      { name: 'Feb', income: 3000, expense: 1398 },
      { name: 'Mar', income: 2000, expense: 9800 },
      { name: 'Apr', income: 2780, expense: 3908 },
      { name: 'May', income: 1890, expense: 4800 },
      { name: 'Jun', income: 2390, expense: 3800 },
  ];

  const inputClass = "w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-colors";

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts & Fees</h1>
          <p className="text-gray-500 dark:text-gray-400">Financial overview and expense tracking</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleGenerateMonthlyFees}
                disabled={processing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
                {processing ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
                Generate Monthly Fees
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-green-600 dark:text-green-300 mb-1">Total Collected</p>
                      <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">${totalCollected.toLocaleString()}</h3>
                  </div>
                  <DollarSign className="text-green-500" />
              </div>
          </Card>
           <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-red-600 dark:text-red-300 mb-1">Total Expenses</p>
                      <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">${totalExpenses.toLocaleString()}</h3>
                  </div>
                  <TrendingDown className="text-red-500" />
              </div>
          </Card>
           <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-orange-600 dark:text-orange-300 mb-1">Pending (This Month)</p>
                      <h3 className="text-2xl font-bold text-orange-900 dark:text-orange-100">${pendingThisMonth.toLocaleString()}</h3>
                  </div>
                  <AlertCircle className="text-orange-500" />
              </div>
          </Card>
           <Card className="p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-sm text-rose-600 dark:text-rose-300 mb-1">Total Arrears (Past)</p>
                      <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-100">${totalArrears.toLocaleString()}</h3>
                  </div>
                  <AlertCircle className="text-rose-500" />
              </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
               <h3 className="font-bold text-gray-900 dark:text-white mb-6">Financial Overview</h3>
               <div className="h-64 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eee" />
                        <Tooltip />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                    </ResponsiveContainer>
               </div>
          </Card>
          <div className="space-y-4">
               <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                   <button 
                        onClick={() => setActiveTab('fees')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'fees' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Student Fees
                   </button>
                   <button 
                        onClick={() => setActiveTab('expenses')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Expenses
                   </button>
               </div>

               {activeTab === 'expenses' && (
                   <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                   >
                       <Plus size={20} /> Add New Expense
                   </button>
               )}
          </div>
      </div>

      <Card noPadding>
         {activeTab === 'fees' ? (
             <div className="overflow-x-auto">
                 <table className="w-full">
                     <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800">
                         <tr>
                             <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                             <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                             <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                             <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Paid / Total</th>
                             <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                             <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                         {fees.map(fee => (
                             <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                 <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{fee.studentName}</td>
                                 <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{fee.type}</td>
                                 <td className="px-6 py-4 text-sm text-gray-500">{fee.dueDate}</td>
                                 <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                     <span className="text-green-600">${fee.paidAmount || 0}</span>
                                     <span className="text-gray-400 mx-1">/</span>
                                     <span>${fee.amount}</span>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                         fee.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                                         fee.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                                         fee.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                     }`}>
                                         {fee.status}
                                     </span>
                                 </td>
                                 <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                     {fee.status !== 'Paid' && (
                                         <>
                                            <button 
                                                onClick={() => handleRemind(fee.id)} 
                                                title="Send Reminder" 
                                                disabled={sendingReminder[fee.id]}
                                                className={`p-2 rounded-lg transition-colors ${sendingReminder[fee.id] ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
                                            >
                                                {sendingReminder[fee.id] ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18}/>}
                                            </button>
                                            <button onClick={() => openPaymentModal(fee)} title="Collect Payment" className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg"><CreditCard size={18}/></button>
                                         </>
                                     )}
                                     {(fee.paidAmount || 0) > 0 && (
                                         <button onClick={() => openReceipt(fee)} title="View Receipt" className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Receipt size={18}/></button>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {expenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.title}</td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{expense.category}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{expense.date}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-600">-${expense.amount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         )}
      </Card>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Add Expense</h3>
                    <button onClick={() => setIsExpenseModalOpen(false)}>✕</button>
                </div>
                <form onSubmit={submitExp(handleAddExpense)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label>
                        <input {...registerExp('title')} className={inputClass} placeholder="e.g. Electric Bill" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                        <select {...registerExp('category')} className={inputClass}>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Salary">Salary</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount</label>
                        <input type="number" {...registerExp('amount')} className={inputClass} required />
                    </div>
                    <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg">Add Expense</button>
                </form>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-md shadow-2xl p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold dark:text-white">Collect Fee</h3>
                    <button onClick={() => setIsPaymentModalOpen(false)}>✕</button>
                </div>
                <div className="mb-4 p-3 bg-gray-50 dark:bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-500">Student: <span className="font-bold text-gray-900 dark:text-white">{selectedFee.studentName}</span></p>
                    <p className="text-sm text-gray-500">Total Due: <span className="font-bold text-gray-900 dark:text-white">${selectedFee.amount}</span></p>
                    <p className="text-sm text-gray-500">Already Paid: <span className="font-bold text-green-600">${selectedFee.paidAmount || 0}</span></p>
                </div>
                <form onSubmit={submitPay(handleProcessPayment)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount to Pay</label>
                        <input type="number" {...registerPay('amount')} className={inputClass} required max={selectedFee.amount - (selectedFee.paidAmount || 0)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Payment Method</label>
                        <select {...registerPay('method')} className={inputClass}>
                            <option value="Cash">Cash</option>
                            <option value="Online">Online Transfer</option>
                            <option value="Check">Check</option>
                        </select>
                    </div>
                    <button type="submit" disabled={processing} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex justify-center">
                        {processing ? <Loader2 className="animate-spin" /> : 'Confirm Payment'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && selectedFee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-0 overflow-hidden animate-fade-in">
                  <div className="bg-primary-600 p-6 text-white text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Receipt size={32} />
                      </div>
                      <h2 className="text-2xl font-bold">Payment Receipt</h2>
                      <p className="text-white/80">EduNexus Management System</p>
                  </div>
                  <div className="p-8 space-y-4">
                      <div className="flex justify-between border-b pb-4">
                          <span className="text-gray-500">Receipt ID</span>
                          <span className="font-mono font-bold">{selectedFee.id.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between border-b pb-4">
                          <span className="text-gray-500">Student Name</span>
                          <span className="font-bold text-gray-900">{selectedFee.studentName}</span>
                      </div>
                      <div className="flex justify-between border-b pb-4">
                          <span className="text-gray-500">Fee Type</span>
                          <span className="font-bold text-gray-900">{selectedFee.type}</span>
                      </div>
                      <div className="flex justify-between border-b pb-4">
                          <span className="text-gray-500">Status</span>
                          <span className="font-bold text-gray-900 uppercase">{selectedFee.status}</span>
                      </div>
                      
                      {/* Payment History Section */}
                      {selectedFee.transactions && selectedFee.transactions.length > 0 && (
                          <div className="border-b pb-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><History size={12}/> Payment History</p>
                              <div className="space-y-2">
                                  {selectedFee.transactions.map((tx, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                          <span className="text-gray-600">{tx.date} ({tx.method})</span>
                                          <span className="font-medium text-green-600">+${tx.amount}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-bold text-gray-900">Total Paid</span>
                          <span className="text-2xl font-bold text-green-600">${selectedFee.paidAmount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Remaining Balance</span>
                          <span className="font-bold text-red-500">${Math.max(0, selectedFee.amount - (selectedFee.paidAmount || 0))}</span>
                      </div>
                  </div>
                  <div className="p-6 bg-gray-50 flex justify-end gap-3">
                      <button onClick={() => setIsReceiptModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Close</button>
                      <button 
                        onClick={handleDownloadReceipt}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center gap-2 hover:bg-primary-700"
                      >
                        <Download size={18}/> Download PDF
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Fees;
