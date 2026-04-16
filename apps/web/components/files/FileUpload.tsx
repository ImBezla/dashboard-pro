'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import api from '@/lib/api';

interface FileUploadProps {
  taskId?: string;
  projectId?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📄';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  return '📎';
};

export function FileUpload({ taskId, projectId }: FileUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const queryKey = taskId 
    ? ['files', 'task', taskId] 
    : ['files', 'project', projectId];

  const { data: files, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const endpoint = taskId 
          ? `/uploads/task/${taskId}` 
          : `/uploads/project/${projectId}`;
        const response = await api.get(endpoint);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch files:', error);
        return [];
      }
    },
    enabled: !!(taskId || projectId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      let url = '/uploads';
      const params = new URLSearchParams();
      if (taskId) params.append('taskId', taskId);
      if (projectId) params.append('projectId', projectId);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/uploads/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    setIsUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        await uploadMutation.mutateAsync(fileList[i]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const response = await api.get(`/uploads/${fileId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-dark flex items-center gap-2">
          📎 Dateien
          {files?.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {files.length}
            </span>
          )}
        </h3>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-4 border-b border-border transition-colors ${
          dragOver ? 'bg-primary/5 border-primary' : ''
        }`}
      >
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-3xl mb-2">📤</div>
            <p className="text-sm font-medium text-dark">
              {isUploading ? 'Wird hochgeladen...' : 'Dateien hierher ziehen'}
            </p>
            <p className="text-xs text-text-light mt-1">
              oder <span className="text-primary font-medium">durchsuchen</span>
            </p>
            <p className="text-xs text-text-light mt-2">Max. 10MB pro Datei</p>
          </label>
        </div>
      </div>

      {/* File List */}
      <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : files && files.length > 0 ? (
          files.map((file: any) => (
            <div key={file.id} className="p-3 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{file.originalName}</p>
                  <p className="text-xs text-text-light">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(file.id, file.originalName)}
                    className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                    title="Herunterladen"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Datei wirklich löschen?')) {
                        deleteMutation.mutate(file.id);
                      }
                    }}
                    className="p-1.5 text-danger hover:bg-danger/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Löschen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-text-light text-sm">
            Keine Dateien vorhanden
          </div>
        )}
      </div>
    </div>
  );
}
