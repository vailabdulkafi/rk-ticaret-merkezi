
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Plus, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AgendaFormModal } from './AgendaFormModal';

interface AgendaItem {
  id: string;
  title: string;
  time: string;
  location?: string;
  type: 'meeting' | 'task' | 'event';
}

const Agenda = () => {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    {
      id: '1',
      title: 'Müşteri Toplantısı',
      time: '09:00',
      location: 'Ofis - Toplantı Salonu',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Proje Teslim',
      time: '14:30',
      type: 'task'
    },
    {
      id: '3',
      title: 'Fuar Ziyareti',
      time: '16:00',
      location: 'İstanbul Fuar Merkezi',
      type: 'event'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'event':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'Toplantı';
      case 'task':
        return 'Görev';
      case 'event':
        return 'Etkinlik';
      default:
        return type;
    }
  };

  const handleAddAgendaItem = (newItem: Omit<AgendaItem, 'id'>) => {
    const agendaItem: AgendaItem = {
      ...newItem,
      id: Date.now().toString()
    };
    setAgendaItems(prev => [...prev, agendaItem]);
  };

  const handleEditAgendaItem = (updatedItem: Omit<AgendaItem, 'id'>) => {
    if (editingItem) {
      setAgendaItems(prev => 
        prev.map(item => 
          item.id === editingItem.id 
            ? { ...updatedItem, id: editingItem.id }
            : item
        )
      );
    }
  };

  const handleEditClick = (item: AgendaItem) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              Bugünün Ajandası
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agendaItems.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                Bugün için planlanmış etkinlik yok
              </div>
            ) : (
              agendaItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-1 text-sm text-gray-600 min-w-[60px]">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(item.type)}`}>
                          {getTypeText(item.type)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AgendaFormModal
        open={showModal}
        onOpenChange={handleModalClose}
        onAdd={editingItem ? handleEditAgendaItem : handleAddAgendaItem}
        editingItem={editingItem}
      />
    </>
  );
};

export default Agenda;
