"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskInsert, TaskUpdate } from "@/types/task";

export async function createTask(data: TaskInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("tasks").insert({
    title: data.title,
    description: data.description,
    status: data.status,
    image_url: data.image_url,
    user_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function updateTask(id: string, data: TaskUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get task to check for attached image
  const { data: task } = await supabase
    .from("tasks")
    .select("image_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // Delete image from storage if exists
  if (task?.image_url) {
    const path = task.image_url.split("/task-attachments/")[1];
    if (path) {
      await supabase.storage.from("task-attachments").remove([path]);
    }
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

export async function toggleTaskStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === "pending" ? "completed" : "pending";
  await updateTask(id, { status: newStatus as "pending" | "completed" });
}

export async function uploadImage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPEG, PNG, GIF, and WebP images are allowed.");
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File size must be less than 5MB.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from("task-attachments")
    .upload(fileName, file);

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from("task-attachments").getPublicUrl(fileName);

  return publicUrl;
}
