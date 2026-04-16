'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface CommentSectionProps {
  taskId?: string;
  projectId?: string;
}

export function CommentSection({ taskId, projectId }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryKey = taskId 
    ? ['comments', 'task', taskId] 
    : ['comments', 'project', projectId];

  const { data: comments, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const endpoint = taskId 
          ? `/comments/task/${taskId}` 
          : `/comments/project/${projectId}`;
        const response = await api.get(endpoint);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        return [];
      }
    },
    enabled: !!(taskId || projectId),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post('/comments', {
        content,
        taskId,
        projectId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment('');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(newComment.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-dark flex items-center gap-2">
          💬 Kommentare
          {comments?.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-border">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Kommentar schreiben..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Wird gesendet...' : 'Kommentieren'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="p-4 hover:bg-slate-50 transition-colors group">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                  {comment.user?.name ? getInitials(comment.user.name) : '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dark text-sm">
                        {comment.user?.name || 'Unbekannt'}
                      </span>
                      <span className="text-xs text-text-light">
                        {formatDistanceToNow(new Date(comment.createdAt), { 
                          addSuffix: true, 
                          locale: de 
                        })}
                      </span>
                    </div>
                    {user?.id === comment.userId && (
                      <button
                        onClick={() => {
                          if (confirm('Kommentar wirklich löschen?')) {
                            deleteCommentMutation.mutate(comment.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-danger hover:text-red-700 text-xs transition-opacity"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-text mt-1 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-text-light text-sm">
            Noch keine Kommentare. Schreibe den ersten!
          </div>
        )}
      </div>
    </div>
  );
}
