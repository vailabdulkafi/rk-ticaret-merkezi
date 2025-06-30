
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DictionaryEntry {
  id: string;
  key_name: string;
  value: string;
  language: string;
  category: string | null;
}

const DictionarySettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('TR');
  const [formData, setFormData] = useState({
    key_name: '',
    value: '',
    language: 'TR',
    category: 'general'
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['dictionary', selectedLanguage, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('dictionary')
        .select('*')
        .eq('language', selectedLanguage)
        .order('key_name', { ascending: true });
      
      if (searchTerm) {
        query = query.or(`key_name.ilike.%${searchTerm}%,value.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DictionaryEntry[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingEntry) {
        const { error } = await supabase
          .from('dictionary')
          .update(data)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dictionary')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
      toast.success(editingEntry ? 'Sözlük girişi güncellendi' : 'Sözlük girişi eklendi');
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dictionary')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
      toast.success('Sözlük girişi silindi');
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      key_name: '',
      value: '',
      language: selectedLanguage,
      category: 'general'
    });
    setEditingEntry(null);
  };

  const handleEdit = (entry: DictionaryEntry) => {
    setEditingEntry(entry);
    setFormData({
      key_name: entry.key_name,
      value: entry.value,
      language: entry.language,
      category: entry.category || 'general'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Sözlük
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Sözlük
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Giriş
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEntry ? 'Sözlük Girişini Düzenle' : 'Yeni Sözlük Girişi'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="key_name">Anahtar *</Label>
                  <Input
                    id="key_name"
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                    required
                    placeholder="Örn: welcome_message, terms_conditions"
                  />
                </div>
                <div>
                  <Label htmlFor="value">Değer *</Label>
                  <Textarea
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    placeholder="Anahtara karşılık gelen metin değeri"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Dil</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TR">Türkçe</SelectItem>
                        <SelectItem value="EN">İngilizce</SelectItem>
                        <SelectItem value="DE">Almanca</SelectItem>
                        <SelectItem value="FR">Fransızca</SelectItem>
                        <SelectItem value="RU">Rusça</SelectItem>
                        <SelectItem value="AR">Arapça</SelectItem>
                        <SelectItem value="PL">Lehçe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="general, quotation, email"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Anahtar veya değer ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TR">Türkçe</SelectItem>
                <SelectItem value="EN">İngilizce</SelectItem>
                <SelectItem value="DE">Almanca</SelectItem>
                <SelectItem value="FR">Fransızca</SelectItem>
                <SelectItem value="RU">Rusça</SelectItem>
                <SelectItem value="AR">Arapça</SelectItem>
                <SelectItem value="PL">Lehçe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {entries?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {searchTerm ? 'Arama kriterlerine uygun sonuç bulunamadı.' : 'Henüz sözlük girişi eklenmemiş.'}
          </p>
        ) : (
          <div className="space-y-4">
            {entries?.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg font-mono">{entry.key_name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {entry.language}
                      </span>
                      {entry.category && (
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{entry.value}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DictionarySettings;
