export interface Task {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: "pending" | "completed";
  user_id: string;
  image_url: string | null;
}

export type TaskInsert = Omit<Task, "id" | "created_at" | "user_id">;

export type TaskUpdate = Partial<TaskInsert>;
