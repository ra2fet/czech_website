import { DashboardCounters } from '../../components/admin/DashboardCounters';
import { DashboardStats } from '../../components/admin/DashboardStats';
import { FeatureGuard } from '../../contexts/FeatureContext'; // Import feature context

export function DashboardHome() {
  
  return (
    <div className="space-y-6">
      <DashboardCounters />

      <FeatureGuard feature="enableAccountingDashboard">
        <DashboardStats />
      </FeatureGuard>
      
   
    </div>
  );
}
