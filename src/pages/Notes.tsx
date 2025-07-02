
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Star, FileText, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoteFormModal } from '@/components/notes/NoteFormModal';
import { DocumentFormModal } from '@/components/notes/DocumentFormModal';
import { NoteCard } from '@/components/notes/NoteCard';
import { DocumentCard } from '@/components/notes/DocumentCard';
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

const Notes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Note[];
    }
  });

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Not silindi');
    },
    onError: () => {
      toast.error('Not silinirken hata oluştu');
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Doküman silindi');
    },
    onError: () => {
      toast.error('Doküman silinirken hata oluştu');
    }
  });

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsNoteModalOpen(true);
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setIsDocumentModalOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    deleteNoteMutation.mutate(id);
  };

  const handleDeleteDocument = (id: string) => {
    deleteDocumentMutation.mutate(id);
  };

  const filteredNotes = notes?.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredDocuments = documents?.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || document.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set([
    ...(notes?.map(n => n.category).filter(Boolean) || []),
    ...(documents?.map(d => d.category).filter(Boolean) || [])
  ]));

  if (notesLoading || documentsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notlar ve Dokümanlar</h1>
          <p className="text-gray-600">Notlarınızı ve dokümanlarınızı organize edin</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsNoteModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Not
          </Button>
          <Button onClick={() => setIsDocumentModalOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Doküman Yükle
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Notlarda ve dokümanlarda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notlar ({filteredNotes?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Dokümanlar ({filteredDocuments?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          {filteredNotes?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz not yok</h3>
                <p className="text-gray-500 text-center mb-4">
                  İlk notunuzu oluşturmak için yukarıdaki "Yeni Not" butonuna tıklayın.
                </p>
                <Button onClick={() => setIsNoteModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Notunu Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes?.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onNoteClick={handleNoteClick}
                  onDelete={handleDeleteNote}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          {filteredDocuments?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz doküman yok</h3>
                <p className="text-gray-500 text-center mb-4">
                  İlk dokümanınızı yüklemek için yukarıdaki "Doküman Yükle" butonuna tıklayın.
                </p>
                <Button onClick={() => setIsDocumentModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  İlk Dokümanını Yükle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments?.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDocumentClick={handleDocumentClick}
                  onDelete={handleDeleteDocument}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NoteFormModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedNote(null);
        }}
        note={selectedNote}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['notes'] })}
      />

      <DocumentFormModal
        isOpen={isDocumentModalOpen}
        onClose={() => {
          setIsDocumentModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
      />
    </div>
  );
};

export default Notes;
