import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types/task";
import TaskList from "@/components/task-list";
import { ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load tasks: {error.message}</p>
      </div>
    );
  }

  const typedTasks = (tasks as Task[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">My Tasks</h1>
            <p className="text-slate-400 text-sm">
              {typedTasks.length} task{typedTasks.length !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>
      </div>

      <TaskList tasks={typedTasks} />
    </div>
  );
}
