'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  taskId?: string;
  projectId?: string;
}

export function TagSelector({ taskId, projectId }: TagSelectorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  const entityType = taskId ? 'task' : 'project';
  const entityId = taskId || projectId;

  // Fetch all available tags
  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await api.get('/tags');
      return response.data || [];
    },
  });

  // Fetch tags for this entity
  const { data: entityTags, isLoading } = useQuery({
    queryKey: ['tags', entityType, entityId],
    queryFn: async () => {
      const response = await api.get(`/tags/${entityType}/${entityId}`);
      return response.data || [];
    },
    enabled: !!entityId,
  });

  const createTagMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/tags', { name: newTagName, color: newTagColor });
      return response.data;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagName('');
      setIsAdding(false);
      // Add to entity
      addTagMutation.mutate(newTag.id);
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.post(`/tags/${entityType}/${entityId}/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', entityType, entityId] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await api.delete(`/tags/${entityType}/${entityId}/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', entityType, entityId] });
    },
  });

  const entityTagIds = entityTags?.map((t: Tag) => t.id) || [];
  const availableTags = allTags?.filter((t: Tag) => !entityTagIds.includes(t.id)) || [];

  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-dark text-sm">🏷️ Tags</h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-primary hover:text-primary-dark font-medium"
        >
          {isAdding ? 'Abbrechen' : '+ Neu'}
        </button>
      </div>

      {/* Current Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {isLoading ? (
          <span className="text-xs text-text-light">Lädt...</span>
        ) : entityTags && entityTags.length > 0 ? (
          entityTags.map((tag: Tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => removeTagMutation.mutate(tag.id)}
                className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-text-light">Keine Tags</span>
        )}
      </div>

      {/* Add existing tag */}
      {availableTags.length > 0 && !isAdding && (
        <div className="flex flex-wrap gap-1">
          {availableTags.slice(0, 5).map((tag: Tag) => (
            <button
              key={tag.id}
              onClick={() => addTagMutation.mutate(tag.id)}
              className="px-2 py-0.5 rounded-full text-xs border-2 border-dashed hover:border-solid transition-all"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              + {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Create new tag */}
      {isAdding && (
        <div className="space-y-2 pt-2 border-t border-border">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Tag-Name..."
            className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  newTagColor === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            onClick={() => createTagMutation.mutate()}
            disabled={!newTagName.trim() || createTagMutation.isPending}
            className="w-full bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            Tag erstellen
          </button>
        </div>
      )}
    </div>
  );
}
