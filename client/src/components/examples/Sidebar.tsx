import Sidebar from '../Sidebar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function SidebarExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen">
        <Sidebar />
      </div>
    </QueryClientProvider>
  );
}