"use client";

import { useState } from "react";
import Image from "next/image";
import type { Task } from "@/types/task";
import { deleteTask, toggleTaskStatus } from "@/app/dashboard/actions";
import { Pencil, Trash2, Check, RotateCcw, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;

    setLoading(true);
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    setLoading(true);
    try {
      await toggleTaskStatus(task.id, task.status);
      toast.success(
        task.status === "pending" ? "Marked complete" : "Marked pending"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`bg-slate-800 border rounded-xl p-5 transition-all hover:shadow-lg ${
        task.status === "completed"
          ? "border-green-500/30 opacity-75"
          : "border-slate-700"
      } ${loading ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Image */}
      {task.image_url && (
        <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-slate-900">
          <Image
            src={task.image_url}
            alt={task.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className={`font-semibold text-white text-lg leading-tight ${
            task.status === "completed" ? "line-through text-slate-400" : ""
          }`}
        >
          {task.title}
        </h3>
        <span
          className={`shrink-0 px-2.5 py-0.5 text-xs font-medium rounded-full ${
            task.status === "completed"
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {task.status}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          {new Date(task.created_at).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-1">
          {!task.image_url && (
            <span title="No image attached">
              <ImageIcon className="h-4 w-4 text-slate-600" />
            </span>
          )}

          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-400 hover:bg-slate-700 transition-colors"
            title={
              task.status === "pending" ? "Mark complete" : "Mark pending"
            }
          >
            {task.status === "pending" ? (
              <Check className="h-4 w-4" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
