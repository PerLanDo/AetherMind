import Dashboard from '../Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function DashboardExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen bg-background">
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}