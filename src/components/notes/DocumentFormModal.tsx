
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
import { X, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  file_url: string;
  category: string | null;
  tags: string[] | null;
  is_favorite: boolean | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document | null;
  onSuccess: () => void;
}

export function DocumentFormModal({ isOpen, onClose, document, onSuccess }: DocumentFormModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setDescription(document.description || '');
      setCategory(document.category || '');
      setTags(document.tags || []);
      setIsFavorite(document.is_favorite || false);
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setTags([]);
      setIsFavorite(false);
      setFile(null);
    }
  }, [document]);

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return { fileName: file.name, fileUrl: publicUrl, fileSize: file.size, fileType: file.type };
  };

  const createDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      let fileInfo = null;
      
      if (file) {
        fileInfo = await uploadFile(file);
      }

      const { error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          ...(fileInfo && {
            file_name: fileInfo.fileName,
            file_url: fileInfo.fileUrl,
            file_size: fileInfo.fileSize,
            file_type: fileInfo.fileType
          }),
          created_by: user?.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Doküman yüklendi');
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error('Doküman yüklenirken hata oluştu');
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async (documentData: any) => {
      let fileInfo = null;
      
      if (file) {
        fileInfo = await uploadFile(file);
      }

      const { error } = await supabase
        .from('documents')
        .update({
          ...documentData,
          ...(fileInfo && {
            file_name: fileInfo.fileName,
            file_url: fileInfo.fileUrl,
            file_size: fileInfo.fileSize,
            file_type: fileInfo.fileType
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', document!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Doküman güncellendi');
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error('Doküman güncellenirken hata oluştu');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Doküman başlığı gerekli');
      return;
    }

    if (!document && !file) {
      toast.error('Dosya seçmek gerekli');
      return;
    }

    const documentData = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      tags: tags.length > 0 ? tags : null,
      is_favorite: isFavorite
    };

    if (document) {
      updateDocumentMutation.mutate(documentData);
    } else {
      createDocumentMutation.mutate(documentData);
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

  const isLoading = createDocumentMutation.isPending || updateDocumentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document ? 'Doküman Düzenle' : 'Yeni Doküman Yükle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Doküman başlığını girin"
              required
            />
          </div>

          {!document && (
            <div className="space-y-2">
              <Label htmlFor="file">Dosya *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                  required
                />
                <Upload className="h-4 w-4 text-gray-400" />
              </div>
              {file && (
                <p className="text-sm text-gray-600">
                  Seçilen dosya: {file.name} ({Math.round(file.size / 1024)} KB)
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Doküman açıklamasını girin"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Kategori girin (örn: Raporlar, Sözleşmeler)"
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
              {isLoading ? 'Kaydediliyor...' : (document ? 'Güncelle' : 'Yükle')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
