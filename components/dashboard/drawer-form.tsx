"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, X, Layers, Check } from "lucide-react";
import type { Drawer } from "@/lib/mock-data";

interface DrawerFormProps {
  cabinetName: string;
  existingDrawers: Drawer[];
  editingDrawer?: Drawer | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function DrawerForm({
  cabinetName,
  existingDrawers,
  editingDrawer,
  onSubmit,
  onCancel,
}: DrawerFormProps) {
  const [drawerNumber, setDrawerNumber] = useState(editingDrawer?.number || "");
  const [positions, setPositions] = useState<string[]>(editingDrawer?.positions || []);
  const [newPosition, setNewPosition] = useState("");

  useEffect(() => {
    if (editingDrawer) {
      setDrawerNumber(editingDrawer.number);
      setPositions([...editingDrawer.positions]);
    }
  }, [editingDrawer]);

  const drawerExists = existingDrawers.some(
    (d) => d.number === drawerNumber && d.id !== editingDrawer?.id
  );

  const suggestedNumber =
    existingDrawers.length > 0
      ? String(
          Math.max(...existingDrawers.map((d) => Number.parseInt(d.number) || 0)) + 1
        )
      : "1";

  const handleAddPosition = () => {
    const pos = newPosition.trim().toUpperCase();
    if (pos && !positions.includes(pos)) {
      setPositions([...positions, pos].sort());
      setNewPosition("");
    }
  };

  const handleRemovePosition = (pos: string) => {
    setPositions(positions.filter((p) => p !== pos));
  };

  const togglePosition = (letter: string) => {
    if (positions.includes(letter)) {
      setPositions(positions.filter((p) => p !== letter).sort());
    } else {
      setPositions([...positions, letter].sort());
    }
  };

  const addRangePositions = (endLetter: string) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const endIndex = alphabet.indexOf(endLetter);
    const letters = alphabet.slice(0, endIndex + 1).split("");
    setPositions(letters);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const positionsInput = form.querySelector(
      'input[name="positions"]'
    ) as HTMLInputElement;
    if (positionsInput) {
      positionsInput.value = positions.join(",");
    }
    onSubmit(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPosition();
    }
  };

  const availableLetters = "ABCDEFGHIJ".split("");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
      {/* Fixed Header */}
      <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <DialogTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          {editingDrawer ? "Editar Gaveta" : "Nova Gaveta"}
        </DialogTitle>
        <DialogDescription>
          {editingDrawer ? "Edite os dados da gaveta" : "Adicione uma nova gaveta ao armario"}{" "}
          <span className="font-medium text-foreground">{cabinetName}</span>
        </DialogDescription>
      </DialogHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        {/* Drawer Number */}
        <div className="grid gap-2">
          <Label htmlFor="number" className="text-sm font-medium">
            Numero da Gaveta *
          </Label>
          <div className="flex gap-2">
            <Input
              id="number"
              name="number"
              type="text"
              placeholder={`Ex: ${suggestedNumber}`}
              value={drawerNumber}
              onChange={(e) => setDrawerNumber(e.target.value)}
              className={drawerExists ? "border-destructive" : ""}
              required
            />
            {!drawerNumber && !editingDrawer && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDrawerNumber(suggestedNumber)}
                className="whitespace-nowrap"
              >
                Usar {suggestedNumber}
              </Button>
            )}
          </div>
          {drawerExists && (
            <p className="text-xs text-destructive">
              Ja existe uma gaveta com este numero
            </p>
          )}
          {existingDrawers.length > 0 && !editingDrawer && (
            <p className="text-xs text-muted-foreground">
              Gavetas existentes: {existingDrawers.map((d) => d.number).join(", ")}
            </p>
          )}
        </div>

        {/* Positions */}
        <div className="grid gap-3">
          <Label className="text-sm font-medium">Posicoes na Gaveta *</Label>
          <p className="text-xs text-muted-foreground">
            Selecione as posicoes disponiveis (A ate J). Cada posicao armazena uma ferramenta.
          </p>

          {/* Quick range buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Ate:</span>
            {["C", "D", "E", "F", "G", "H", "I", "J"].map((letter) => {
              const alphabet = "ABCDEFGHIJ";
              const count = alphabet.indexOf(letter) + 1;
              const rangeStr = alphabet.slice(0, count);
              const isActive = positions.length === count && positions.join("") === rangeStr;
              return (
                <Button
                  key={letter}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => addRangePositions(letter)}
                >
                  A-{letter} ({count})
                </Button>
              );
            })}
          </div>

          {/* Individual toggles */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Ou individualmente:</p>
            <div className="flex flex-wrap gap-1.5">
              {availableLetters.map((letter) => {
                const isSelected = positions.includes(letter);
                return (
                  <Button
                    key={letter}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-9 w-9 p-0 text-sm font-semibold"
                    onClick={() => togglePosition(letter)}
                  >
                    {isSelected ? (
                      <span className="flex items-center gap-0.5">
                        {letter}
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      letter
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Manual position input */}
          <div className="flex gap-2">
            <Input
              placeholder="Personalizada (ex: K, L, 1)"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value.toUpperCase())}
              onKeyDown={handleKeyPress}
              maxLength={3}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleAddPosition}
              disabled={!newPosition.trim() || positions.includes(newPosition.trim().toUpperCase())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Compact preview */}
          {positions.length > 0 ? (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Gaveta {drawerNumber || "#"} - Preview
                </p>
                <span className="text-xs text-muted-foreground">
                  {positions.length} posicao(es)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {positions.map((pos) => (
                  <button
                    type="button"
                    key={pos}
                    className="flex items-center gap-1 rounded-md bg-primary/20 border border-primary/30 px-2.5 py-1 text-sm font-medium text-foreground hover:bg-destructive/20 hover:border-destructive/50 transition-colors"
                    onClick={() => handleRemovePosition(pos)}
                    title={`Remover posicao ${pos}`}
                  >
                    {pos}
                    <X className="h-3 w-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 rounded-lg border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">Nenhuma posicao selecionada</p>
            </div>
          )}

          {/* Hidden inputs */}
          <input type="hidden" name="positions" value={positions.join(",")} />
          {editingDrawer && (
            <input type="hidden" name="drawerId" value={editingDrawer.id} />
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-card">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!drawerNumber || positions.length === 0 || drawerExists}
        >
          {editingDrawer ? "Salvar Alteracoes" : "Criar Gaveta"}
        </Button>
      </div>
    </form>
  );
}
