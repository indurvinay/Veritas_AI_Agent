import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Upload, Download, Trash2, Search, FileText, Image, Table, File, Folder, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

function getFileIcon(mimeType) {
  if (!mimeType) return { icon: File, color: '#5ABFCC' };
  if (mimeType.includes('pdf')) return { icon: FileText, color: '#FF3A3A' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { icon: Table, color: '#00FF88' };
  if (mimeType.includes('document') || mimeType.includes('word')) return { icon: FileText, color: '#0066FF' };
  if (mimeType.includes('image')) return { icon: Image, color: '#7B2FFF' };
  if (mimeType.includes('folder')) return { icon: Folder, color: '#00D4FF' };
  return { icon: File, color: '#5ABFCC' };
}

export default function DrivePanel() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Debounce search input by 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch files
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['driveFiles'],
    queryFn: () => axios.get('/api/drive/files').then((r) => r.data),
  });

  // Search files (debounced)
  const { data: searchData } = useQuery({
    queryKey: ['driveSearch', debouncedQuery],
    queryFn: () => axios.get(`/api/drive/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.data),
    enabled: debouncedQuery.length > 2,
  });

  const files = debouncedQuery.length > 2 ? (searchData?.files || []) : (data?.files || []);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/drive/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success(`"${file.name}" uploaded!`);
      queryClient.invalidateQueries({ queryKey: ['driveFiles'] });
    } catch (err) {
      toast.error('Upload failed');
    }
    setUploading(false);
    setUploadProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id, name) => {
    try {
      await axios.delete(`/api/drive/files/${id}`);
      queryClient.invalidateQueries({ queryKey: ['driveFiles'] });
      toast.success(`"${name}" deleted`);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/drive/download/${id}`, '_blank');
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
            className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-950/20 border border-yellow-500/30"
            style={{ boxShadow: '0 0 12px rgba(251, 188, 5, 0.2)' }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="" className="w-4 h-4" />
          </div>
          <h2 className="text-lg tracking-widest font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-jarvis-cyan)' }}>
            DRIVE
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="glow-btn text-[10px] flex items-center gap-1" onClick={() => refetch().then(() => toast.success('Drive files refreshed!'))}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="glow-btn glow-btn-primary text-[10px] flex items-center gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload
          </button>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
      </div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          className="jarvis-input w-full pl-10"
          placeholder="Search files..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-3 mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: 'var(--color-jarvis-cyan)' }}>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.1)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--color-jarvis-cyan), var(--color-jarvis-purple))', width: `${uploadProgress}%` }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%'] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag-and-Drop Zone + File Grid */}
      <div
        className={`overflow-y-auto pr-2 rounded-xl transition-all ${dragging ? 'drag-active' : ''}`}
        style={{
          maxHeight: 'calc(100vh - 260px)',
          border: dragging ? undefined : '2px dashed transparent',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {dragging && (
          <div className="flex flex-col items-center justify-center py-12">
            <Upload size={40} style={{ color: 'var(--color-jarvis-cyan)' }} className="mb-3 animate-bounce" />
            <p className="text-sm" style={{ color: 'var(--color-jarvis-cyan)' }}>Drop file to upload</p>
          </div>
        )}

        {!dragging && (
          isLoading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="glass-panel p-4">
                  <div className="w-10 h-10 skeleton mb-3 rounded" />
                  <div className="h-3 skeleton mb-2" />
                  <div className="h-2 w-1/2 skeleton" />
                </div>
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <HardDrive size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-jarvis-cyan)' }} />
              <p className="text-sm opacity-50">No files found</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {files.map((file, i) => {
                const { icon: FileIcon, color } = getFileIcon(file.mimeType);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="glass-panel glass-panel-hover p-4 group relative"
                  >
                    <FileIcon size={28} style={{ color }} className="mb-3" />
                    <p className="text-xs font-semibold truncate mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      {file.name}
                    </p>
                    <p className="text-[10px] opacity-40">{file.size}</p>
                    <p className="text-[10px] opacity-30">
                      {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ''}
                    </p>

                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="glow-btn p-1" onClick={() => handleDownload(file.id)}>
                        <Download size={12} />
                      </button>
                      <button className="glow-btn glow-btn-danger p-1" onClick={() => handleDelete(file.id, file.name)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
