import { ClipboardList } from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm">
            Task list coming soon...
          </p>
        </div>
      </div>

      <div className="text-center py-16">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-white mb-1">No tasks yet</h3>
        <p className="text-slate-400 text-sm">
          Task CRUD will be added in the next commit.
        </p>
      </div>
    </div>
  );
}
