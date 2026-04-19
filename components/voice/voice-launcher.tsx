"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VoiceAgent } from "./voice-agent";

export function VoiceLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
        aria-label="Open Sahaya voice coordinator"
      >
        <Mic className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Sahaya Voice Coordinator
            </DialogTitle>
          </DialogHeader>
          {open && <VoiceAgent />}
        </DialogContent>
      </Dialog>
    </>
  );
}
