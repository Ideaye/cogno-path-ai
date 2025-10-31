import { ExamManagement } from "@/components/settings/ExamManagement";

export default function Settings() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <ExamManagement />
    </div>
  );
}