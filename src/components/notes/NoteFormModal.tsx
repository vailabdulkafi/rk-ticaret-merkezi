
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface NoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  onSuccess: () => void;
}

export function NoteFormModal({ isOpen, onClose, note, onSuccess }: NoteFormModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setCategory(note.category || '');
      setTags(note.tags || []);
      setIsFavorite(note.is_favorite || false);
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
      setIsFavorite(false);
    }
  }, [note]);

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const { error } = await supabase
        .from('notes')
        .insert([{
          ...noteData,
          created_by: user?.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Not oluşturuldu');
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error('Not oluşturulurken hata oluştu');
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (noteData: any) => {
      const { error } = await supabase
        .from('notes')
        .update({
          ...noteData,
          updated_at: new Date().toISOString()
        })
        .eq('id', note!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Not güncellendi');
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error('Not güncellenirken hata oluştu');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Not başlığı gerekli');
      return;
    }

    const noteData = {
      title: title.trim(),
      content: content.trim() || null,
      category: category.trim() || null,
      tags: tags.length > 0 ? tags : null,
      is_favorite: isFavorite
    };

    if (note) {
      updateNoteMutation.mutate(noteData);
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const isLoading = createNoteMutation.isPending || updateNoteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Not Düzenle' : 'Yeni Not Oluştur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Not başlığını girin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">İçerik</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Not içeriğini girin"
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori girin (örn: İş, Kişisel)"
            />
          </div>

          <div className="space-y-2">
            <Label>Etiketler</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Etiket ekle"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="favorite"
              checked={isFavorite}
              onCheckedChange={setIsFavorite}
            />
            <Label htmlFor="favorite">Favorilere ekle</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : (note ? 'Güncelle' : 'Oluştur')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
