
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const RecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <FileText className="h-4 w-4 md:h-5 md:w-5" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <div className="text-sm">
              <p className="font-medium">Sistem aktif</p>
              <p className="text-gray-600 text-xs">CRM sistemi çalışıyor</p>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm py-4">
            Henüz aktivite bulunmuyor
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
