import Link from "next/link";
import { CheckSquare, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <CheckSquare className="h-16 w-16 text-blue-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Task & Media Vault
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          Your personal task manager with media attachments. Organize, track,
          and complete your tasks with ease.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-lg transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
