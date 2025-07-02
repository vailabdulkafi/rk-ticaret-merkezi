
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Calendar, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface NoteCardProps {
  note: Note;
  onNoteClick: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function NoteCard({ note, onNoteClick, onDelete }: NoteCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      onDelete(note.id);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle 
            className="text-sm font-medium cursor-pointer hover:text-blue-600 line-clamp-2"
            onClick={() => onNoteClick(note)}
          >
            {note.title}
          </CardTitle>
          <div className="flex items-center gap-1 ml-2">
            {note.is_favorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {note.content && (
          <p className="text-xs text-gray-600 line-clamp-3 mt-2">{note.content}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {note.category && (
            <Badge variant="secondary" className="text-xs">
              {note.category}
            </Badge>
          )}
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-gray-400" />
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-400 mt-2">
            <Calendar className="mr-1 h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(note.updated_at), { 
                addSuffix: true, 
                locale: tr 
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
