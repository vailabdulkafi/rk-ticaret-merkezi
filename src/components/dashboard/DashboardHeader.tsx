
interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
}

const DashboardHeader = ({ userName, userEmail }: DashboardHeaderProps) => {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600 text-sm md:text-base">
        Hoş geldiniz, {userName || userEmail}! 
        İşletmenizin genel durumunu buradan takip edebilirsiniz.
      </p>
    </div>
  );
};

export default DashboardHeader;
