'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Robust CSV Line Parser (handles quoted strings with commas like "$1,005.00")
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values.map((v) => v.replace(/^["']|["']$/g, '').trim());
}

// Clean amount parsing (handles "$1,273.00", "-$500.00", "($500.00)")
function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let s = String(val).trim();
  let isNegative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1);
  } else if (s.startsWith('-') || s.includes('-$')) {
    isNegative = true;
  }
  const cleaned = s.replace(/[\$,\s-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}

// Clean date parsing (handles "9/3", "09/03", "9/3/2026", "2026-09-03")
function parseDate(val) {
  if (!val) return new Date().toISOString().split('T')[0];
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  const slashParts = s.split(/[\/\-]/);
  const currentYear = new Date().getFullYear();
  if (slashParts.length === 2) {
    const month = String(parseInt(slashParts[0], 10)).padStart(2, '0');
    const day = String(parseInt(slashParts[1], 10)).padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  } else if (slashParts.length === 3) {
    let year = slashParts[2];
    if (year.length === 2) year = `20${year}`;
    const month = String(parseInt(slashParts[0], 10)).padStart(2, '0');
    const day = String(parseInt(slashParts[1], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

// Clean confirmed parsing
function parseConfirmed(val) {
  if (typeof val === 'boolean') return val;
  if (val === undefined || val === null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'checked' || s === 'y';
}

export default function CashTrackerPage() {
  const [entries, setEntries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [summary, setSummary] = useState({
    totalCashDrops: 0,
    totalCashPayouts: 0,
    netCashOnHand: 0,
    totalZelle: 0,
    pendingAmount: 0,
    pendingCount: 0,
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [filterPerson, setFilterPerson] = useState('ALL');
  const [filterForm, setFilterForm] = useState('ALL');
  const [filterConfirmed, setFilterConfirmed] = useState('ALL');
  const [filterDateRange, setFilterDateRange] = useState('ALL'); // 'ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New Entry Form State
  const [newPerson, setNewPerson] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newForm, setNewForm] = useState('Cash'); // 'Cash', 'Zelle', 'cash' (payout)
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newConfirmed, setNewConfirmed] = useState(true);

  // Popup Modal Add State (Mobile Friendly)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState(null);
  const [editPerson, setEditPerson] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editForm, setEditForm] = useState('Cash');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editConfirmed, setEditConfirmed] = useState(true);

  // CSV Import Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterPerson !== 'ALL') params.append('person', filterPerson);
      if (filterForm !== 'ALL') params.append('form', filterForm);
      if (filterConfirmed !== 'ALL') params.append('confirmed', filterConfirmed);

      const today = new Date();
      if (filterDateRange === 'TODAY') {
        const d = today.toISOString().split('T')[0];
        params.append('startDate', d);
        params.append('endDate', d);
      } else if (filterDateRange === 'YESTERDAY') {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        const d = y.toISOString().split('T')[0];
        params.append('startDate', d);
        params.append('endDate', d);
      } else if (filterDateRange === 'WEEK') {
        const w = new Date(today);
        w.setDate(w.getDate() - 7);
        params.append('startDate', w.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      } else if (filterDateRange === 'MONTH') {
        const m = new Date(today);
        m.setDate(1);
        params.append('startDate', m.toISOString().split('T')[0]);
        params.append('endDate', today.toISOString().split('T')[0]);
      } else if (filterDateRange === 'CUSTOM') {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }

      const res = await fetch(`/api/admin/cash-tracker?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (!res.ok) throw new Error('Failed to load cash tracker data');
      const data = await res.json();
      setEntries(data.entries || []);
      setSummary(
        data.summary || {
          totalCashDrops: 0,
          totalCashPayouts: 0,
          netCashOnHand: 0,
          totalZelle: 0,
          pendingAmount: 0,
          pendingCount: 0,
          grandTotal: 0,
        }
      );
      if (data.drivers) setDrivers(data.drivers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterPerson, filterForm, filterConfirmed, filterDateRange, customStartDate, customEndDate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEntries();
  }, [fetchEntries]);

  // Quick submit a new drop or payout entry
  const handleAddEntry = async (e) => {
    if (e) e.preventDefault();
    if (!newPerson.trim()) {
      setError('Please specify a person/driver name');
      return;
    }
    if (!newAmount || isNaN(Number(newAmount))) {
      setError('Please enter a valid numeric amount');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      let finalAmount = parseFloat(newAmount);
      let finalForm = newForm;

      // If user selected payout or typed payroll note, ensure amount is negative
      if (newForm === 'cash' || newNote.toLowerCase().includes('payroll')) {
        if (finalAmount > 0) finalAmount = -Math.abs(finalAmount);
        finalForm = 'cash';
      }

      const res = await fetch('/api/admin/cash-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          person: newPerson.trim(),
          date: newDate,
          form: finalForm,
          amount: finalAmount,
          note: newNote.trim(),
          confirmed: newConfirmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add entry');

      setNewAmount('');
      setNewNote('');
      setIsAddModalOpen(false);
      setSuccessMsg('Entry recorded successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchEntries();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Parse CSV content into row objects
  const processCSVContent = (content) => {
    if (!content || !content.trim()) {
      setParsedRows([]);
      return;
    }

    try {
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setParsedRows([]);
        return;
      }

      // Default column indices
      let personIdx = 0;
      let dateIdx = 1;
      let confirmedIdx = 2;
      let formIdx = 3;
      let amountIdx = 4;
      let noteIdx = 5;

      const firstLineParts = parseCSVLine(lines[0]);
      const lowerHeaders = firstLineParts.map((h) => h.toLowerCase());

      const hasHeader = lowerHeaders.some(
        (h) =>
          h.includes('person') ||
          h.includes('name') ||
          h.includes('date') ||
          h.includes('amount') ||
          h.includes('form')
      );

      let startIndex = 0;
      if (hasHeader) {
        startIndex = 1;
        lowerHeaders.forEach((col, idx) => {
          if (col.includes('person') || col.includes('name') || col.includes('driver')) personIdx = idx;
          else if (col.includes('date') || col.includes('day')) dateIdx = idx;
          else if (col.includes('confirm') || col.includes('status')) confirmedIdx = idx;
          else if (col.includes('form') || col.includes('method') || col.includes('type')) formIdx = idx;
          else if (col.includes('amount') || col.includes('total') || col.includes('cash')) amountIdx = idx;
          else if (col.includes('note') || col.includes('memo') || col.includes('desc')) noteIdx = idx;
        });
      }

      const rows = [];
      for (let i = startIndex; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        if (parts.length < 2) continue;

        const person = parts[personIdx] || '';
        const rawDate = parts[dateIdx];
        const rawConfirmed = parts[confirmedIdx];
        const rawForm = parts[formIdx] || 'Cash';
        const rawAmount = parts[amountIdx];
        const note = parts[noteIdx] || '';

        if (!person && !rawAmount) continue;

        const amount = parseAmount(rawAmount);
        const date = parseDate(rawDate);
        const confirmed = parseConfirmed(rawConfirmed);
        let form = rawForm.trim() || 'Cash';
        if (amount < 0 && form.toLowerCase() === 'cash') form = 'cash';

        rows.push({
          person: person.trim(),
          date,
          confirmed,
          form,
          amount,
          note: note.trim(),
        });
      }

      setParsedRows(rows);
      setImportError('');
    } catch (err) {
      console.error('CSV Parsing Error:', err);
      setImportError('Failed to parse CSV: ' + err.message);
      setParsedRows([]);
    }
  };

  // Handle file select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvRawText(text);
        processCSVContent(text);
      }
    };
    reader.readAsText(file);
  };

  // Handle paste text change
  const handleRawTextChange = (e) => {
    const text = e.target.value;
    setCsvRawText(text);
    processCSVContent(text);
  };

  // Submit batch CSV records to backend
  const handleExecuteImport = async () => {
    if (!parsedRows.length) {
      setImportError('No valid rows available to import.');
      return;
    }

    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/admin/cash-tracker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(parsedRows),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import CSV records');

      setSuccessMsg(`Successfully imported ${data.count || parsedRows.length} records!`);
      setIsImportOpen(false);
      setCsvFile(null);
      setCsvRawText('');
      setParsedRows([]);
      fetchEntries();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  };

  // 1-Click Toggle Confirmed with in-place update (prevents row shifting/re-sorting)
  const handleToggleConfirmed = async (entry) => {
    const updatedStatus = !entry.confirmed;
    const amt = Number(entry.amount) || 0;

    // Optimistic in-place update of row
    setEntries((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, confirmed: updatedStatus } : item))
    );

    // Optimistic in-place update of pending summary counters
    setSummary((prev) => ({
      ...prev,
      pendingAmount: updatedStatus ? prev.pendingAmount - amt : prev.pendingAmount + amt,
      pendingCount: updatedStatus ? Math.max(0, prev.pendingCount - 1) : prev.pendingCount + 1,
    }));

    try {
      const res = await fetch(`/api/admin/cash-tracker/${entry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ confirmed: updatedStatus }),
      });
      if (!res.ok) {
        fetchEntries(); // Revert on failure
      }
    } catch (err) {
      console.error('Error toggling confirmation:', err);
      fetchEntries(); // Revert on error
    }
  };

  // Toggle single row selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all filtered rows
  const handleSelectAll = () => {
    if (filteredEntries.length === 0) return;
    const allFilteredIds = filteredEntries.map((e) => e.id);
    const allSelected = allFilteredIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Bulk Delete Selected Entries
  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected ${selectedIds.length === 1 ? 'entry' : 'entries'}?`)) return;

    setIsBulkDeleting(true);
    try {
      const res = await fetch('/api/admin/cash-tracker', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete selected entries');

      const deletedSet = new Set(selectedIds);
      setEntries((prev) => prev.filter((e) => !deletedSet.has(e.id)));
      setSelectedIds([]);
      setSuccessMsg(`Successfully deleted ${data.count ?? selectedIds.length} entries`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchEntries();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEditPerson(entry.person);
    setEditDate(new Date(entry.date).toISOString().split('T')[0]);
    setEditForm(entry.form);
    setEditAmount(String(entry.amount));
    setEditNote(entry.note || '');
    setEditConfirmed(entry.confirmed);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      let finalAmount = parseFloat(editAmount);
      if (isNaN(finalAmount)) throw new Error('Invalid amount');

      if (editForm === 'cash' || editNote.toLowerCase().includes('payroll')) {
        if (finalAmount > 0) finalAmount = -Math.abs(finalAmount);
      }

      const res = await fetch(`/api/admin/cash-tracker/${editingEntry.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({
          person: editPerson.trim(),
          date: editDate,
          form: editForm,
          amount: finalAmount,
          note: editNote.trim(),
          confirmed: editConfirmed,
        }),
      });

      if (!res.ok) throw new Error('Failed to update entry');

      setEditingEntry(null);
      fetchEntries();
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Single Entry
  const handleDeleteEntry = async (id) => {
    if (!confirm('Are you sure you want to delete this cash tracker entry?')) return;
    try {
      const res = await fetch(`/api/admin/cash-tracker/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete entry');
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchEntries();
    } catch (err) {
      alert(err.message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!entries.length) {
      alert('No entries to export');
      return;
    }

    const headers = ['Person', 'Date', 'Confirmed', 'Form', 'Amount', 'Note'];
    const rows = entries.map((item) => [
      `"${item.person.replace(/"/g, '""')}"`,
      `"${new Date(item.date).toLocaleDateString('en-US')}"`,
      item.confirmed ? 'YES' : 'NO',
      `"${item.form}"`,
      item.amount.toFixed(2),
      `"${(item.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cash_on_hand_tracker_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter entries locally by search query if typed
  const filteredEntries = !searchQuery.trim()
    ? entries
    : entries.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.person.toLowerCase().includes(q) ||
          (item.note && item.note.toLowerCase().includes(q)) ||
          item.form.toLowerCase().includes(q)
        );
      });

  // Format short date (e.g. 9/3)
  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="w-full space-y-6 pb-16 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Cash On Hand Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pc-green/10 text-pc-green border border-pc-green/30">
              Live Reconciliation
            </span>
          </div>
          <p className="text-sm text-pc-muted mt-1">
            Track daily cash collections, Zelle drops, payroll deductions, and physical verification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Entry Popup Modal Button (Easy on Mobile & Desktop) */}
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              setError('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-pc-green hover:bg-pc-green/90 text-black shadow-md shadow-pc-green/20 hover:shadow-pc-green/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>+ Add Entry</span>
          </button>

          {/* Record Payroll Shortcut */}
          <button
            type="button"
            onClick={() => {
              setNewForm('cash');
              setNewNote('Payroll');
              setNewAmount('');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all flex items-center gap-1.5"
          >
            <span className="text-sm font-black">-</span> Record Payroll
          </button>

          {/* Import CSV Button */}
          <button
            type="button"
            onClick={() => {
              setIsImportOpen(true);
              setImportError('');
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pc-green/15 text-pc-green border border-pc-green/40 hover:bg-pc-green/25 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Import CSV
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-pc-dark border border-pc-border text-white hover:border-pc-green/50 hover:text-pc-green transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Export CSV
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchEntries}
            className="p-2 rounded-xl bg-pc-dark border border-pc-border text-pc-muted hover:text-white hover:border-white/20 transition-all"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-white font-bold ml-2">×</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-pc-green/50 rounded-xl text-pc-green text-sm">
          {successMsg}
        </div>
      )}

      {/* KPI Metric Summary Cards (Ordered with Total Net Balance First) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* 1. Total Net Balance (FIRST POSITION) */}
        <div className="p-4 bg-pc-dark/80 backdrop-blur-md border border-pc-green/40 rounded-2xl relative overflow-hidden group hover:border-pc-green/60 transition-all shadow-[0_0_20px_rgba(34,197,94,0.08)]">
          <div className="absolute top-0 right-0 w-28 h-28 bg-pc-green/15 rounded-full blur-2xl pointer-events-none group-hover:bg-pc-green/25 transition-all" />
          <p className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Total Net Balance</p>
          <p className="text-2xl md:text-3xl font-black text-pc-green tracking-tight">
            ${summary.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-[11px] text-pc-muted">Cash + Zelle combined</p>
        </div>

        {/* 2. Net Cash On Hand */}
        <div className="p-4 bg-pc-dark/80 backdrop-blur-md border border-pc-border rounded-2xl relative overflow-hidden group hover:border-pc-green/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pc-green/10 rounded-full blur-2xl pointer-events-none group-hover:bg-pc-green/15 transition-all" />
          <p className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Net Cash On Hand</p>
          <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
            ${summary.netCashOnHand.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-pc-muted">
            <span className="text-white font-semibold">${summary.totalCashDrops.toFixed(2)} in</span>
            <span>•</span>
            <span className="text-red-400 font-semibold">${Math.abs(summary.totalCashPayouts).toFixed(2)} out</span>
          </div>
        </div>

        {/* 3. Zelle Collected */}
        <div className="p-4 bg-pc-dark/80 backdrop-blur-md border border-pc-border rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />
          <p className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Zelle Received</p>
          <p className="text-2xl md:text-3xl font-black text-amber-300 tracking-tight">
            ${summary.totalZelle.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-2 text-[11px] text-pc-muted">Digital bank transfers</p>
        </div>

        {/* 4. Pending Confirmation */}
        <div className={`p-4 bg-pc-dark/80 backdrop-blur-md border rounded-2xl relative overflow-hidden transition-all ${
          summary.pendingCount > 0 ? 'border-amber-500/50 bg-amber-950/10' : 'border-pc-border'
        }`}>
          <p className="text-xs font-bold text-pc-muted uppercase tracking-wider mb-1">Unconfirmed Drops</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl md:text-3xl font-black tracking-tight ${summary.pendingCount > 0 ? 'text-amber-400' : 'text-pc-muted'}`}>
              ${summary.pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {summary.pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                {summary.pendingCount} pending
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-pc-muted">Awaiting physical verification</p>
        </div>
      </div>

      {/* Rapid Inline Add Entry Bar (Google Sheets Style Desktop Input) */}
      <div className="hidden md:block bg-pc-dark/90 border border-pc-border rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-pc-green flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Quick Add Row
          </h2>
          <span className="text-[11px] text-pc-muted">Press Enter to record</span>
        </div>

        <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
          {/* Person */}
          <div className="md:col-span-3">
            <label htmlFor="new-person-input" className="block text-[10px] font-bold text-pc-muted uppercase mb-1">Person</label>
            <div className="relative">
              <input
                id="new-person-input"
                type="text"
                list="drivers-list"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="e.g. choo, nicole, matt..."
                className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-sm text-white placeholder-pc-muted/50 focus:outline-none focus:border-pc-green"
              />
              <datalist id="drivers-list">
                {drivers.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date */}
          <div className="md:col-span-2">
            <label htmlFor="new-date-input" className="block text-[10px] font-bold text-pc-muted uppercase mb-1">Date</label>
            <input
              id="new-date-input"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-pc-green"
            />
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <label htmlFor="new-form-select" className="block text-[10px] font-bold text-pc-muted uppercase mb-1">Form</label>
            <select
              id="new-form-select"
              value={newForm}
              onChange={(e) => {
                setNewForm(e.target.value);
                if (e.target.value === 'cash' && !newNote) {
                  setNewNote('Payroll');
                }
              }}
              className="w-full bg-pc-black border border-pc-border rounded-xl px-2.5 py-2 text-sm text-white focus:outline-none focus:border-pc-green"
            >
              <option value="Cash">Cash (Drop)</option>
              <option value="Zelle">Zelle</option>
              <option value="cash">cash (Payroll / Payout)</option>
            </select>
          </div>

          {/* Amount */}
          <div className="md:col-span-2">
            <label htmlFor="new-amount-input" className="block text-[10px] font-bold text-pc-muted uppercase mb-1">Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pc-muted text-sm">$</span>
              <input
                id="new-amount-input"
                type="number"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="372.00"
                className="w-full bg-pc-black border border-pc-border rounded-xl pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-pc-green"
              />
            </div>
          </div>

          {/* Note */}
          <div className="md:col-span-2">
            <label htmlFor="new-note-input" className="block text-[10px] font-bold text-pc-muted uppercase mb-1">Note (Optional)</label>
            <input
              id="new-note-input"
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g. Payroll"
              className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-sm text-white placeholder-pc-muted/50 focus:outline-none focus:border-pc-green"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-1 flex flex-col justify-end">
            <span className="block text-[10px] font-bold text-pc-muted uppercase mb-1 text-center">Save</span>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-pc-green hover:bg-pc-green/90 text-black font-black text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? '...' : '+'}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-pc-dark/70 border border-pc-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative min-w-[160px] md:min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name / note..."
              className="w-full bg-pc-black border border-pc-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-pc-green"
            />
            <svg className="w-3.5 h-3.5 text-pc-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          {/* Date range filter */}
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="bg-pc-black border border-pc-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pc-green"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="YESTERDAY">Yesterday</option>
            <option value="WEEK">Last 7 Days</option>
            <option value="MONTH">This Month</option>
            <option value="CUSTOM">Custom Range</option>
          </select>

          {filterDateRange === 'CUSTOM' && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-pc-black border border-pc-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-pc-green"
              />
              <span className="text-pc-muted">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-pc-black border border-pc-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-pc-green"
              />
            </div>
          )}

          {/* Form Filter */}
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            className="bg-pc-black border border-pc-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pc-green"
          >
            <option value="ALL">All Forms</option>
            <option value="Cash">Cash Drops</option>
            <option value="Zelle">Zelle</option>
            <option value="Payroll">Payroll / Payouts</option>
          </select>

          {/* Confirmed Filter */}
          <select
            value={filterConfirmed}
            onChange={(e) => setFilterConfirmed(e.target.value)}
            className="bg-pc-black border border-pc-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pc-green"
          >
            <option value="ALL">All Statuses</option>
            <option value="true">Confirmed Only</option>
            <option value="false">Unconfirmed Only</option>
          </select>

          {/* Person Filter */}
          <select
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="bg-pc-black border border-pc-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-pc-green"
          >
            <option value="ALL">All People</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="text-pc-muted font-medium">
          Showing <span className="text-white font-bold">{filteredEntries.length}</span> entries
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              <span className="inline-flex items-center justify-center bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded text-xs mr-1.5">
                {selectedIds.length}
              </span>
              {selectedIds.length === 1 ? 'entry' : 'entries'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-pc-muted hover:text-white underline transition-colors"
            >
              Deselect all
            </button>
          </div>
          <button
            type="button"
            disabled={isBulkDeleting}
            onClick={handleDeleteSelected}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isBulkDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                <span>Delete Selected ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Spreadsheet Table View (Optimized Proportional Layout without Blank Space) */}
      <div className="bg-pc-dark/95 border border-pc-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-[#2b396b] text-white text-xs font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredEntries.length > 0 && filteredEntries.every((e) => selectedIds.includes(e.id))}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-400 bg-black/40 text-pc-green focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pc-green"
                    title="Select all"
                  />
                </th>
                <th className="py-3 px-4 w-[18%] min-w-[130px]">Person</th>
                <th className="py-3 px-3 w-[12%] min-w-[90px] text-right pr-6">Date</th>
                <th className="py-3 px-3 w-[11%] min-w-[90px] text-center">Confirmed</th>
                <th className="py-3 px-4 w-[13%] min-w-[100px]">Form</th>
                <th className="py-3 px-4 w-[15%] min-w-[120px] text-right">Amount</th>
                <th className="py-3 px-4 w-[17%] min-w-[140px]">Note</th>
                <th className="py-3 px-3 w-[12%] min-w-[120px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pc-border/40 text-sm">
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-pc-muted">
                    <div className="w-6 h-6 border-2 border-pc-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading tracker entries...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-pc-muted">
                    <p className="text-white font-bold mb-1">No cash tracker entries found</p>
                    <p className="text-xs text-pc-muted mb-4">Add your first drop above or import CSV data!</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-pc-green text-black font-bold text-xs rounded-xl hover:bg-pc-green/90 transition-all"
                      >
                        + Add Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsImportOpen(true)}
                        className="px-4 py-2 bg-pc-dark border border-pc-border text-white font-bold text-xs rounded-xl hover:border-pc-green transition-all"
                      >
                        Import CSV Data
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => {
                  const isNegative = Number(item.amount) < 0;
                  const isPayroll = isNegative || (item.form || '').toLowerCase() === 'cash' && isNegative;
                  const isZelle = (item.form || '').toLowerCase().includes('zelle');

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.03] transition-colors group ${
                        selectedIds.includes(item.id) ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-gray-400 bg-black/40 text-pc-green focus:ring-0 focus:ring-offset-0 cursor-pointer accent-pc-green"
                        />
                      </td>

                      {/* Person */}
                      <td className="py-2.5 px-4 font-semibold text-white">
                        <span className="capitalize">{item.person}</span>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 text-right pr-6 font-mono text-pc-muted text-xs">
                        {formatShortDate(item.date)}
                      </td>

                      {/* Confirmed Checkbox (Purple-blue box matching screenshot) */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleConfirmed(item)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-all mx-auto ${
                            item.confirmed
                              ? 'bg-[#6754e2] text-white shadow-[0_0_8px_rgba(103,84,226,0.4)]'
                              : 'border border-pc-border bg-pc-black/60 text-transparent hover:border-pc-green/50'
                          }`}
                          title={item.confirmed ? 'Confirmed (Click to unconfirm)' : 'Unconfirmed (Click to confirm)'}
                        >
                          <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </button>
                      </td>

                      {/* Form Badge */}
                      <td className="py-2.5 px-4">
                        {isPayroll ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-[#ad0b0b] text-white shadow-sm lowercase">
                            cash
                          </span>
                        ) : isZelle ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#332b1e] text-[#e8d5b5] border border-[#52442d]">
                            Zelle
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#1e293b] text-[#94a3b8] border border-[#334155]">
                            Cash
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                        isNegative ? 'text-red-400' : 'text-white'
                      }`}>
                        {isNegative ? (
                          <span>-${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        ) : (
                          <span>${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="py-2.5 px-4 text-xs text-pc-muted">
                        {item.note ? (
                          <span className={isPayroll ? 'text-red-300 font-medium' : 'text-white/80'}>
                            {item.note}
                          </span>
                        ) : (
                          <span className="text-pc-muted/30">—</span>
                        )}
                      </td>

                      {/* Actions: Always visible Edit & Delete buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pc-green/50 text-pc-muted hover:text-white rounded-lg transition-all flex items-center gap-1 active:scale-95"
                            title="Edit entry"
                          >
                            <svg className="w-3.5 h-3.5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.688-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(item.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/50 text-pc-muted hover:text-red-400 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                            title="Delete entry"
                          >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Popup Modal (Mobile & Desktop Friendly) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-pc-border/60 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">Add Cash / Drop Entry</h3>
                <p className="text-xs text-pc-muted">Quickly record a cash collection, Zelle transfer, or payroll payout.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-pc-muted hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Person / Driver</label>
                <input
                  type="text"
                  list="modal-drivers-list"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  placeholder="e.g. Choo, Nicole, Matt..."
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                  required
                />
                <datalist id="modal-drivers-list">
                  {drivers.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>

                {/* Quick Driver Suggestion Pills */}
                {drivers.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] font-bold text-pc-muted uppercase">Drivers:</span>
                    {drivers.slice(0, 8).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setNewPerson(d.name)}
                        className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                          newPerson.toLowerCase() === d.name.toLowerCase()
                            ? 'bg-pc-green text-black border-pc-green font-bold'
                            : 'bg-pc-black border-pc-border text-pc-muted hover:text-white'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-pc-muted font-bold uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-pc-muted font-bold uppercase mb-1">Form</label>
                  <select
                    value={newForm}
                    onChange={(e) => {
                      setNewForm(e.target.value);
                      if (e.target.value === 'cash' && !newNote) {
                        setNewNote('Payroll');
                      }
                    }}
                    className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                  >
                    <option value="Cash">Cash (Standard Drop)</option>
                    <option value="Zelle">Zelle (Bank Transfer)</option>
                    <option value="cash">cash (Payroll / Payout)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pc-muted text-base font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="850.00"
                    className="w-full bg-pc-black border border-pc-border rounded-xl pl-8 pr-3.5 py-2.5 text-white font-mono text-base font-bold focus:border-pc-green focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Shift 1 drop, Payroll, Gas expense..."
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-pc-green focus:outline-none"
                />
                {/* Note Quick Pills */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-pc-muted uppercase">Quick:</span>
                  {['Payroll', 'Shift Drop', 'Evening Drop', 'Gas'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setNewNote(tag);
                        if (tag === 'Payroll') setNewForm('cash');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-pc-black border border-pc-border text-pc-muted hover:text-white"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-new-confirmed"
                  checked={newConfirmed}
                  onChange={(e) => setNewConfirmed(e.target.checked)}
                  className="rounded border-pc-border text-pc-green focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modal-new-confirmed" className="text-white font-medium cursor-pointer text-xs">
                  Confirmed (Physically verified & counted)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-pc-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-pc-muted hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-pc-green hover:bg-pc-green/90 text-black font-black text-xs rounded-xl shadow-md active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save & Record Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Edit Entry</h3>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="text-pc-muted hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Person</label>
                <input
                  type="text"
                  value={editPerson}
                  onChange={(e) => setEditPerson(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white text-sm focus:border-pc-green focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-pc-muted font-bold uppercase mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white text-sm focus:border-pc-green focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-pc-muted font-bold uppercase mb-1">Form</label>
                  <select
                    value={editForm}
                    onChange={(e) => setEditForm(e.target.value)}
                    className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white text-sm focus:border-pc-green focus:outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Zelle">Zelle</option>
                    <option value="cash">cash (Payroll)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-pc-green focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-pc-muted font-bold uppercase mb-1">Note</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. Payroll"
                  className="w-full bg-pc-black border border-pc-border rounded-xl px-3 py-2 text-white text-sm focus:border-pc-green focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-confirmed"
                  checked={editConfirmed}
                  onChange={(e) => setEditConfirmed(e.target.checked)}
                  className="rounded border-pc-border text-pc-green focus:ring-0"
                />
                <label htmlFor="edit-confirmed" className="text-white font-medium cursor-pointer">
                  Confirmed (Physically verified & counted)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl text-pc-muted hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pc-green text-black font-black rounded-xl hover:bg-pc-green/90"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-pc-dark border border-pc-border rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-pc-border/60 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-pc-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Import CSV File / Spreadsheet Data
                </h3>
                <p className="text-xs text-pc-muted">Upload your CSV spreadsheet export or copy-paste rows directly.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(false);
                  setCsvFile(null);
                  setCsvRawText('');
                  setParsedRows([]);
                }}
                className="text-pc-muted hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 text-xs">
                {importError}
              </div>
            )}

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* File Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-pc-border hover:border-pc-green/60 bg-pc-black/40 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-pc-green/10 text-pc-green flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  {csvFile ? csvFile.name : 'Click to upload or drag & drop CSV file'}
                </p>
                <p className="text-xs text-pc-muted">
                  Supports CSV downloaded from Google Sheets or Excel (.csv, .tsv)
                </p>
              </div>

              {/* Or Paste Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-pc-muted uppercase">
                    Or Paste Spreadsheet Rows Directly:
                  </label>
                  {csvRawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvRawText('');
                        setParsedRows([]);
                        setCsvFile(null);
                      }}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      Clear text
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={handleRawTextChange}
                  placeholder={`Person, Date, Confirmed, Form, Amount, Note\nchoo, 9/3, TRUE, cash, $372.00,\nnicole, 9/3, TRUE, Cash, $850.00,\nChoo, 9/9, TRUE, cash, -$500.00, Payroll`}
                  className="w-full bg-pc-black border border-pc-border rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-pc-green"
                />
              </div>

              {/* Live Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-pc-green flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-pc-green animate-pulse" />
                      Parsed {parsedRows.length} valid rows ready for import
                    </span>
                    <span className="text-xs text-pc-muted font-mono">
                      Net: ${(parsedRows.reduce((acc, r) => acc + r.amount, 0)).toFixed(2)}
                    </span>
                  </div>

                  <div className="border border-pc-border/60 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-pc-dark/95 sticky top-0 border-b border-pc-border/60 text-pc-muted font-bold">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Person</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Confirmed</th>
                          <th className="py-2 px-3">Form</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-pc-border/20 text-white/90">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02]">
                            <td className="py-1 px-3 text-pc-muted text-[10px]">{idx + 1}</td>
                            <td className="py-1 px-3 font-semibold capitalize">{row.person}</td>
                            <td className="py-1 px-3 font-mono text-pc-muted text-[11px]">{formatShortDate(row.date)}</td>
                            <td className="py-1 px-3">
                              {row.confirmed ? (
                                <span className="text-pc-green font-bold text-[11px]">YES</span>
                              ) : (
                                <span className="text-pc-muted text-[11px]">NO</span>
                              )}
                            </td>
                            <td className="py-1 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.amount < 0 ? 'bg-red-600 text-white' : row.form.toLowerCase().includes('zelle') ? 'bg-amber-950/40 text-amber-300' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {row.form}
                              </span>
                            </td>
                            <td className={`py-1 px-3 text-right font-mono font-bold ${row.amount < 0 ? 'text-red-400' : 'text-pc-green'}`}>
                              {row.amount < 0 ? `-$${Math.abs(row.amount).toFixed(2)}` : `$${row.amount.toFixed(2)}`}
                            </td>
                            <td className="py-1 px-3 text-pc-muted text-[11px]">{row.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-pc-border/60 pt-3">
              <span className="text-xs text-pc-muted">
                {parsedRows.length > 0 ? `${parsedRows.length} record(s) queued` : 'Awaiting CSV file or pasted data'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setCsvFile(null);
                    setCsvRawText('');
                    setParsedRows([]);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-pc-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importing || parsedRows.length === 0}
                  onClick={handleExecuteImport}
                  className="px-5 py-2 bg-pc-green hover:bg-pc-green/90 text-black font-black text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {importing ? 'Importing Records...' : `Import ${parsedRows.length} Records`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
