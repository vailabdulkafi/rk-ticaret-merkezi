
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  isAmount?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, color, bgColor, isAmount }: StatsCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${isAmount ? 'text-xs md:text-sm' : 'text-sm'} font-medium text-gray-600 leading-tight`}>
            {title}
          </CardTitle>
          <div className={`p-1.5 md:p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-3 w-3 md:h-4 md:w-4 ${isAmount ? '' : 'md:h-5 md:w-5'} ${color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-lg md:text-2xl ${isAmount ? 'md:text-lg' : 'md:text-3xl'} font-bold text-gray-900`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
