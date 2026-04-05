"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/supabase/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sahaya</CardTitle>
          <p className="text-sm text-muted-foreground">
            Community Need Intelligence Grid
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={() => signInWithGoogle()}
          >
            Sign in with Google
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Sign in to access the coordination dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
