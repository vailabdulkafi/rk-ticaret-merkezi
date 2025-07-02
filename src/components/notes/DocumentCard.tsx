
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Trash2, Calendar, Tag, Download, FileText, File, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface DocumentCardProps {
  document: Document;
  onDocumentClick: (document: Document) => void;
  onDelete: (id: string) => void;
}

export function DocumentCard({ document, onDocumentClick, onDelete }: DocumentCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu dokümanı silmek istediğinizden emin misiniz?')) {
      onDelete(document.id);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(document.file_url, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 flex-1"
            onClick={() => onDocumentClick(document)}
          >
            {getFileIcon(document.file_type)}
            <CardTitle className="text-sm font-medium line-clamp-2">
              {document.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {document.is_favorite && (
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" />
            </Button>
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
        {document.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-2">{document.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {document.category && (
              <Badge variant="secondary" className="text-xs">
                {document.category}
              </Badge>
            )}
            {document.file_size && (
              <span className="text-xs text-gray-500">
                {formatFileSize(document.file_size)}
              </span>
            )}
          </div>
          
          {document.tags && document.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-gray-400" />
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{document.tags.length - 3}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center text-xs text-gray-400 mt-2">
            <Calendar className="mr-1 h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(document.updated_at), { 
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
