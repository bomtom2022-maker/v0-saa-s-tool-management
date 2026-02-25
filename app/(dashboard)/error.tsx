"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.log("[v0] Dashboard error caught:", error.message, error.stack);
  }, [error]);

  const handleReset = () => {
    try {
      sessionStorage.removeItem("tms-data-store");
    } catch {}
    reset();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-bold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error.message || "Ocorreu um erro inesperado no dashboard."}
      </p>
      <div className="flex gap-3">
        <Button onClick={handleReset} variant="default">
          Limpar dados e recarregar
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Recarregar pagina
        </Button>
      </div>
    </div>
  );
}
