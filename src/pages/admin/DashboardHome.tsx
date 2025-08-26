import { DashboardCounters } from '../../components/admin/DashboardCounters';
import { DashboardStats } from '../../components/admin/DashboardStats';

export function DashboardHome() {
  return (
    <div className="space-y-6">
      <DashboardCounters />
      <DashboardStats />
    </div>
  );
}
