import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold text-white mb-6">Welcome to Infralyze</h1>
      <p className="text-lg text-gray-300 mb-8">
        Upload your infrastructure code and see it visualized instantly.
      </p>
      <FileUpload />
    </main>
  );
}
