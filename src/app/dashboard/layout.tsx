// src/app/dashboard/layout.tsx
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div
        className="flex h-screen bg-[#0a0a0a] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,136,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}




// import ProtectedRoute from '@/components/layout/ProtectedRoute';
// import Sidebar from '@/components/layout/Sidebar';
// import TopNav from '@/components/layout/TopNav';

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <ProtectedRoute>
//       <div className="flex h-screen bg-gray-50">
//         {/* Sidebar */}
//         <Sidebar />

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           {/* Top Navigation */}
//           <TopNav />

//           {/* Page Content */}
//           {children}
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// }