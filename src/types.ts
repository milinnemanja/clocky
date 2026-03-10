/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  duration: number; // in minutes
}

export const calculateDuration = (start: string, end: string): number => {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let startTotal = startH * 60 + startM;
  let endTotal = endH * 60 + endM;
  
  // Handle overnight shifts
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }
  
  return endTotal - startTotal;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const getWeekNumber = (dateStr: string): number => {
  const date = new Date(dateStr);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const getMonthName = (monthKey: string): string => {
  const [year, month] = monthKey.split('-');
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
};
