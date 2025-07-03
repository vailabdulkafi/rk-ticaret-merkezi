
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AgendaItem {
  title: string;
  time: string;
  location?: string;
  type: 'meeting' | 'task' | 'event';
}

interface AgendaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: AgendaItem) => void;
  editingItem?: AgendaItem & { id: string } | null;
}

export function AgendaFormModal({ open, onOpenChange, onAdd, editingItem }: AgendaFormModalProps) {
  const [formData, setFormData] = useState<AgendaItem>({
    title: '',
    time: '',
    location: '',
    type: 'meeting'
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        time: editingItem.time,
        location: editingItem.location || '',
        type: editingItem.type
      });
    } else {
      setFormData({ title: '', time: '', location: '', type: 'meeting' });
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Etkinlik başlığı gerekli');
      return;
    }
    
    if (!formData.time.trim()) {
      toast.error('Zaman gerekli');
      return;
    }

    onAdd({
      ...formData,
      location: formData.location || undefined
    });
    
    toast.success(editingItem ? 'Etkinlik güncellendi' : 'Etkinlik ajandaya eklendi');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Etkinlik Düzenle' : 'Yeni Etkinlik Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Etkinlik başlığı"
              required
            />
          </div>

          <div>
            <Label htmlFor="time">Saat *</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tür</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'meeting' | 'task' | 'event') => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Toplantı</SelectItem>
                <SelectItem value="task">Görev</SelectItem>
                <SelectItem value="event">Etkinlik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location">Konum</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Etkinlik konumu (opsiyonel)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit">
              {editingItem ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
