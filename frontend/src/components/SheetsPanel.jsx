import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Table, RefreshCw, Plus, Trash2, X, Edit3 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function AppendRowModal({ headers, onSubmit, onClose }) {
  const [values, setValues] = useState(headers.map(() => ''));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
      toast.success('Row appended!');
      onClose();
    } catch {
      toast.error('Failed to append row');
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,8,0.8)', backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      <motion.form
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onSubmit={handleSubmit}
        className="glass-panel p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm tracking-wider" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            APPEND ROW
          </h3>
          <button type="button" onClick={onClose}><X size={18} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <div className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto">
          {headers.map((header, i) => (
            <div key={i}>
              <label className="text-[10px] tracking-wider opacity-50 mb-1 block" style={{ fontFamily: 'var(--font-heading)' }}>
                {header}
              </label>
              <input
                className="jarvis-input w-full"
                value={values[i]}
                onChange={(e) => { const v = [...values]; v[i] = e.target.value; setValues(v); }}
                placeholder={header}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="glow-btn text-[10px]" onClick={onClose}>Cancel</button>
          <button type="submit" className="glow-btn glow-btn-primary text-[10px]" disabled={submitting}>
            {submitting ? 'Appending...' : 'Append'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function SheetsPanel() {
  const [showAppend, setShowAppend] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, colIndex, value }
  const [clearing, setClearing] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sheetData'],
    queryFn: () => axios.get('/api/sheets/data').then((r) => r.data),
  });

  // Activity log
  const { data: activityData } = useQuery({
    queryKey: ['sheetActivity'],
    queryFn: () => axios.get('/api/sheets/activity').then((r) => r.data),
  });

  const headers = data?.headers || [];
  const rows = data?.rows || [];
  const activityLog = activityData?.log || [];

  const handleAppend = async (values) => {
    await axios.post('/api/sheets/append', { values });
    queryClient.invalidateQueries({ queryKey: ['sheetData'] });
  };

  const getCellRange = (rowIndex, colIndex) => {
    const colLetter = String.fromCharCode(65 + colIndex);
    const rowNum = rowIndex + 2; // Rows start at 1, headers are row 1, data starts at row 2
    return `${colLetter}${rowNum}`;
  };

  const handleCellSave = async (rowIndex, colIndex, value) => {
    const range = getCellRange(rowIndex, colIndex);
    const originalValue = rows[rowIndex]?.[colIndex] || '';

    if (value === originalValue) {
      setEditingCell(null);
      return;
    }

    try {
      await axios.put('/api/sheets/update', { range, value });
      toast.success(`Updated cell ${range}`);
      queryClient.invalidateQueries({ queryKey: ['sheetData'] });
    } catch (err) {
      toast.error('Failed to update cell');
    }
    setEditingCell(null);
  };

  const handleClearSheet = async () => {
    if (!confirm('Are you sure you want to clear all data in the sheet? (Headers will be preserved)')) return;
    setClearing(true);
    try {
      // Clear data cells A2:Z500 to preserve headers
      await axios.delete('/api/sheets/clear', { data: { range: 'A2:Z500' } });
      toast.success('Sheet cleared successfully');
      queryClient.invalidateQueries({ queryKey: ['sheetData'] });
    } catch {
      toast.error('Failed to clear sheet');
    }
    setClearing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-green-950/20 border border-green-500/30"
            style={{ boxShadow: '0 0 12px rgba(52, 168, 83, 0.2)' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Google_Sheets_2020_logo.svg" alt="" className="w-4 h-4" />
          </div>
          <h2 className="text-lg tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            SHEETS
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="glow-btn text-[10px] flex items-center gap-1" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="glow-btn glow-btn-danger text-[10px] flex items-center gap-1" onClick={handleClearSheet} disabled={headers.length === 0 || clearing}>
            <Trash2 size={13} /> Clear Sheet
          </button>
          <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1" onClick={() => setShowAppend(true)} disabled={headers.length === 0}>
            <Plus size={13} /> Append Row
          </button>
        </div>
      </div>

      {/* Helper Info */}
      {headers.length > 0 && (
        <p className="text-[10px] opacity-50 mb-3 flex items-center gap-1">
          <Edit3 size={10} /> Double-click any cell to edit inline. Press Enter to save, Esc to cancel.
        </p>
      )}

      {/* Table */}
      <div className="glass-panel overflow-auto mb-6" style={{ maxHeight: 'calc(100vh - 340px)' }}>
        {isLoading ? (
          <div className="p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 mb-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 flex-1 skeleton" />
                ))}
              </div>
            ))}
          </div>
        ) : headers.length === 0 ? (
          <div className="p-8 text-center">
            <Table size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-jarvis-cyan)' }} />
            <p className="text-sm opacity-50">No data in sheet</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.2)' }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-[10px] tracking-wider font-semibold"
                    style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(0,212,255,0.05)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,212,255,0.02)',
                  }}
                  onMouseEnter={(e) => {
                    if (!editingCell || editingCell.rowIndex !== i) {
                      e.currentTarget.style.background = 'rgba(0,212,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!editingCell || editingCell.rowIndex !== i) {
                      e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,212,255,0.02)';
                    }
                  }}
                >
                  {headers.map((_, j) => {
                    const isEditing = editingCell && editingCell.rowIndex === i && editingCell.colIndex === j;
                    return (
                      <td 
                        key={j} 
                        className="px-4 py-2.5 min-w-[120px]" 
                        style={{ color: 'var(--color-text-primary)' }}
                        onDoubleClick={() => {
                          setEditingCell({ rowIndex: i, colIndex: j, value: row[j] || '' });
                        }}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            className="jarvis-input text-xs w-full py-0.5 px-1 h-6"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={() => handleCellSave(i, j, editingCell.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave(i, j, editingCell.value);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                        ) : (
                          row[j] || '—'
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity Log */}
      <div className="glass-panel p-4">
        <h3 className="text-xs tracking-widest mb-3 font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
          AGENT ACTIVITY LOG
        </h3>
        <div className="overflow-y-auto" style={{ maxHeight: '150px' }}>
          {activityLog.length === 0 ? (
            <p className="text-xs opacity-40">No activity recorded</p>
          ) : (
            activityLog.slice(-10).reverse().map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: '1px solid rgba(0,212,255,0.05)' }}>
                <span className="text-[10px] opacity-40">{entry[0]?.slice(11, 19) || '—'}</span>
                <span className="tag-badge tag-real text-[9px]">{entry[1] || '—'}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{entry[2] || '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Append Modal */}
      <AnimatePresence>
        {showAppend && <AppendRowModal headers={headers} onSubmit={handleAppend} onClose={() => setShowAppend(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
