import Sidebar from "@/components/Sidebar";
import CitationGenerator from "@/components/CitationGenerator";

export default function CitationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Citation Generator</h1>
              <p className="text-muted-foreground">
                Generate professional citations in APA, MLA, Chicago, Harvard, and IEEE formats.
              </p>
            </div>
            <CitationGenerator />
          </div>
        </main>
      </div>
    </div>
  );
}
