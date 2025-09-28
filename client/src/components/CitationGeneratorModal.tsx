import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import CitationGenerator from "./CitationGenerator";

interface CitationGeneratorModalProps {
  onClose: () => void;
}

export default function CitationGeneratorModal({ onClose }: CitationGeneratorModalProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CitationGenerator />
    </div>
  );
}
