import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-6">
          <img src="/logo.png" alt="Thresho" className="w-20 h-20 mx-auto" />
        </div>

        <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
          Thresho
        </h2>

        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading your secure wallet...</span>
        </div>
      </div>
    </div>
  );
}
