import Sidebar from "@/components/Sidebar";
import AIToolsPanel from "@/components/AIToolsPanel";

export default function AIToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">AI Writing Tools</h1>
              <p className="text-muted-foreground">
                Enhance your writing with AI-powered tools for grammar, style,
                and content improvement.
              </p>
            </div>
            <AIToolsPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
