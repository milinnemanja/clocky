/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, Trash2, Calendar, Clock3, FileText, ChevronRight, LogOut, BarChart3, Wallet, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { TimeEntry, calculateDuration, formatDuration, getMonthKey, getMonthName, getWeekNumber } from './types.ts';

const STORAGE_KEY = 'clocky_entries';
const RATES_KEY = 'clocky_rates';

export default function App() {
  const [view, setView] = useState<'welcome' | 'tracker' | 'stats'>('welcome');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [monthlyRates, setMonthlyRates] = useState<Record<string, number>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    const savedRates = localStorage.getItem(RATES_KEY);
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error('Failed to load entries', e);
      }
    }
    if (savedRates) {
      try {
        setMonthlyRates(JSON.parse(savedRates));
      } catch (e) {
        console.error('Failed to load rates', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(RATES_KEY, JSON.stringify(monthlyRates));
  }, [monthlyRates]);

  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date);
      setStartTime(editingEntry.startTime);
      setEndTime(editingEntry.endTime);
      setNotes(editingEntry.notes);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('17:00');
      setNotes('');
    }
  }, [editingEntry]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = calculateDuration(startTime, endTime);
    
    if (editingEntry) {
      setEntries(entries.map(entry => 
        entry.id === editingEntry.id 
          ? { ...entry, date, startTime, endTime, notes, duration }
          : entry
      ));
      setEditingEntry(null);
    } else {
      const newEntry: TimeEntry = {
        id: crypto.randomUUID(),
        date,
        startTime,
        endTime,
        notes,
        duration,
      };
      setEntries([newEntry, ...entries]);
    }
    
    setIsFormOpen(false);
    setNotes('');
  };

  const startEditing = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const bulkDelete = () => {
    setEntries(entries.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const updateRate = (monthKey: string, rate: number) => {
    setMonthlyRates({ ...monthlyRates, [monthKey]: rate });
  };

  const totalMinutes = entries.reduce((acc, curr) => acc + curr.duration, 0);

  // Grouping logic for stats
  const groupedData = entries.reduce((acc, entry) => {
    const monthKey = getMonthKey(entry.date);
    const weekNum = getWeekNumber(entry.date);
    
    if (!acc[monthKey]) {
      acc[monthKey] = { totalMinutes: 0, weeks: {} };
    }
    
    if (!acc[monthKey].weeks[weekNum]) {
      acc[monthKey].weeks[weekNum] = 0;
    }
    
    acc[monthKey].totalMinutes += entry.duration;
    acc[monthKey].weeks[weekNum] += entry.duration;
    
    return acc;
  }, {} as Record<string, { totalMinutes: number; weeks: Record<number, number> }>);

  const sortedMonthKeys = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen flex flex-col selection:bg-white selection:text-black">
      <main className="flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'welcome' ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-grow flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="mb-8 relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-white/10 rounded-full"
                />
                <Clock size={80} strokeWidth={1} className="text-white" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 uppercase break-words">
                Clocky
              </h1>
              <p className="text-white/50 max-w-md mb-12 text-sm md:text-base leading-relaxed px-4">
                Precise work time tracking for the modern professional. 
                Simple, fast, and secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setView('tracker')}
                  className="group flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-white/90 transition-all touch-manipulation"
                >
                  Start Tracking
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setView('stats')}
                  className="group flex items-center justify-center gap-3 border border-white/20 text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-white/5 transition-all touch-manipulation"
                >
                  View Reports
                  <BarChart3 size={20} />
                </button>
              </div>
            </motion.div>
          ) : view === 'tracker' ? (
            <motion.div
              key="tracker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto w-full p-4 md:p-6 pt-8 md:pt-12"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 md:mb-12">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Dashboard</h2>
                  <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-widest mt-1">
                    Total Time: <span className="text-white">{formatDuration(totalMinutes)}</span>
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {entries.length > 0 && (
                    <button
                      onClick={() => {
                        setIsSelectMode(!isSelectMode);
                        if (isSelectMode) setSelectedIds(new Set());
                      }}
                      className={`flex-1 sm:flex-none border border-white/10 p-4 rounded-2xl transition-colors flex items-center justify-center touch-manipulation ${isSelectMode ? 'bg-white text-black border-white' : 'hover:bg-white/5'}`}
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                  <button
                    onClick={() => setView('stats')}
                    className="flex-1 sm:flex-none border border-white/10 p-4 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <BarChart3 size={24} />
                  </button>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex-1 sm:flex-none bg-white text-black p-4 rounded-2xl hover:bg-white/90 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <Plus size={24} />
                    <span className="ml-2 font-bold uppercase text-xs tracking-widest sm:hidden">Add Entry</span>
                  </button>
                  <button
                    onClick={() => setView('welcome')}
                    className="sm:flex-none border border-white/10 p-4 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <LogOut size={24} />
                  </button>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {isSelectMode && entries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSelectAll}
                        className="text-[10px] uppercase tracking-widest font-bold bg-white/10 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {selectedIds.size === entries.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-[10px] uppercase tracking-widest text-white/40">
                        {selectedIds.size} Selected
                      </span>
                    </div>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={bulkDelete}
                        className="bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      >
                        Delete Selected
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Entry List */}
              <div className="space-y-4 pb-20">
                {entries.length === 0 ? (
                  <div className="text-center py-16 md:py-20 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-white/30 uppercase text-[10px] md:text-xs tracking-[0.2em]">No entries yet</p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={entry.id}
                      onClick={() => isSelectMode && toggleSelect(entry.id)}
                      className={`bg-[#222] border p-5 md:p-6 rounded-[2rem] group transition-all cursor-pointer ${
                        selectedIds.has(entry.id) 
                          ? 'border-white ring-1 ring-white/20' 
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 md:gap-6">
                          {isSelectMode && (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedIds.has(entry.id) ? 'bg-white border-white' : 'border-white/20'
                            }`}>
                              {selectedIds.has(entry.id) && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                          )}
                          <div className="bg-white/5 p-3 rounded-2xl shrink-0">
                            <Calendar size={20} className="text-white/60" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{new Date(entry.date).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">Date</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="bg-white/5 p-3 rounded-2xl shrink-0">
                            <Clock3 size={20} className="text-white/60" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{entry.startTime} — {entry.endTime}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">Shift</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 flex-grow border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                          <div className="md:text-right">
                            <p className="text-xl font-black">{formatDuration(entry.duration)}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Duration</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isSelectMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(entry);
                                }}
                                className="p-3 text-white/20 hover:text-white transition-colors touch-manipulation"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEntry(entry.id);
                              }}
                              className="p-3 -mr-2 text-white/20 hover:text-red-500 transition-colors touch-manipulation"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                      {entry.notes && (
                        <div className="mt-5 pt-4 border-t border-white/5 flex gap-3 items-start">
                          <FileText size={14} className="text-white/30 mt-1 shrink-0" />
                          <p className="text-xs text-white/60 leading-relaxed italic">{entry.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto w-full p-4 md:p-6 pt-8 md:pt-12"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Monthly Reports</h2>
                  <p className="text-white/40 text-[10px] md:text-xs uppercase tracking-widest mt-1">
                    Performance & Earnings Overview
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setView('tracker')}
                    className="flex-1 sm:flex-none bg-white text-black px-6 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <Clock size={20} className="mr-2" />
                    Tracker
                  </button>
                  <button
                    onClick={() => setView('welcome')}
                    className="sm:flex-none border border-white/10 p-4 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-center touch-manipulation"
                  >
                    <LogOut size={24} />
                  </button>
                </div>
              </div>

              <div className="space-y-6 pb-20">
                {sortedMonthKeys.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-white/30 uppercase text-xs tracking-[0.2em]">No data available</p>
                  </div>
                ) : (
                  sortedMonthKeys.map((monthKey) => {
                    const data = groupedData[monthKey];
                    const isExpanded = expandedMonth === monthKey;
                    const rate = monthlyRates[monthKey] || 0;
                    const earnings = (data.totalMinutes / 60) * rate;

                    return (
                      <div key={monthKey} className="bg-[#222] border border-white/5 rounded-[2rem] overflow-hidden">
                        <div 
                          className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setExpandedMonth(isExpanded ? null : monthKey)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-white/5 p-3 rounded-2xl">
                              <Calendar size={20} className="text-white/60" />
                            </div>
                            <div>
                              <p className="text-lg font-black uppercase tracking-tight">{getMonthName(monthKey)}</p>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">Total: {formatDuration(data.totalMinutes)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                              <p className="text-lg font-black">{earnings.toLocaleString('sr-RS', { style: 'currency', currency: 'RSD' })}</p>
                              <p className="text-[10px] uppercase tracking-widest text-white/40">Earnings</p>
                            </div>
                            {isExpanded ? <ChevronUp size={20} className="text-white/30" /> : <ChevronDown size={20} className="text-white/30" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5"
                            >
                              <div className="p-6 space-y-6">
                                {/* Weekly Breakdown */}
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4">Weekly Breakdown</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(data.weeks).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([week, mins]) => (
                                      <div key={week} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                                        <p className="text-xs font-bold uppercase tracking-widest">Week {week}</p>
                                        <p className="text-sm font-black">{formatDuration(mins as number)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Earnings Calculator */}
                                <div className="bg-white/5 p-6 rounded-3xl space-y-4">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Wallet size={16} className="text-white/40" />
                                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Earnings Configuration</p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                                    <div className="w-full sm:flex-grow space-y-2">
                                      <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Hourly Rate (RSD)</label>
                                      <input
                                        type="number"
                                        placeholder="Enter rate..."
                                        value={rate || ''}
                                        onChange={(e) => updateRate(monthKey, parseFloat(e.target.value) || 0)}
                                        className="w-full bg-[#1a1a1a]"
                                      />
                                    </div>
                                    <div className="w-full sm:w-auto bg-white text-black p-4 rounded-xl text-center min-w-[140px]">
                                      <p className="text-xs uppercase font-black tracking-widest mb-1">Total Earned</p>
                                      <p className="text-xl font-black">{earnings.toLocaleString('sr-RS', { style: 'currency', currency: 'RSD' })}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative bg-[#1a1a1a] border-t sm:border border-white/10 w-full max-w-md p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 sm:hidden" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">
                {editingEntry ? 'Edit Entry' : 'New Entry'}
              </h3>
              <form onSubmit={handleAddEntry} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-base" // text-base prevents auto-zoom on iOS
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Start Time (24h)</label>
                    <div className="flex gap-2">
                      <select 
                        value={startTime.split(':')[0]} 
                        onChange={(e) => setStartTime(`${e.target.value}:${startTime.split(':')[1]}`)}
                        className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-xl p-4 text-white appearance-none text-center"
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-white/20">:</span>
                      <select 
                        value={startTime.split(':')[1]} 
                        onChange={(e) => setStartTime(`${startTime.split(':')[0]}:${e.target.value}`)}
                        className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-xl p-4 text-white appearance-none text-center"
                      >
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">End Time (24h)</label>
                    <div className="flex gap-2">
                      <select 
                        value={endTime.split(':')[0]} 
                        onChange={(e) => setEndTime(`${e.target.value}:${endTime.split(':')[1]}`)}
                        className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-xl p-4 text-white appearance-none text-center"
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-white/20">:</span>
                      <select 
                        value={endTime.split(':')[1]} 
                        onChange={(e) => setEndTime(`${endTime.split(':')[0]}:${e.target.value}`)}
                        className="flex-1 bg-[#2a2a2a] border border-white/10 rounded-xl p-4 text-white appearance-none text-center"
                      >
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Notes (Optional)</label>
                  <textarea
                    placeholder="What did you work on?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[100px] resize-none text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="order-2 sm:order-1 flex-1 border border-white/10 py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white/5 touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="order-1 sm:order-2 flex-1 bg-white text-black py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-white/90 touch-manipulation"
                  >
                    {editingEntry ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-8 text-center border-t border-white/5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
          Created by Nemanja Milin &copy; all rights reserved 2026
        </p>
      </footer>
    </div>
  );
}
