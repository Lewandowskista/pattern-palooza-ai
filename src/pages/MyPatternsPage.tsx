import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { MaterialType, PatternData } from "@shared/pattern";

interface SavedPattern {
  id: string;
  name: string;
  description: string | null;
  material: string;
  pattern_data: PatternData;
  created_at: string;
  updated_at: string;
}

const MyPatternsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patterns, setPatterns] = useState<SavedPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPatterns();
  }, [user]);

  const fetchPatterns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_patterns")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load patterns", description: error.message, variant: "destructive" });
    } else {
      setPatterns((data ?? []) as SavedPattern[]);
    }
    setLoading(false);
  };

  const deletePattern = async (id: string) => {
    const { error } = await supabase.from("saved_patterns").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setPatterns((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Pattern deleted" });
    }
  };

  const openPattern = (pattern: SavedPattern) => {
    navigate("/editor", {
      state: {
        pattern: pattern.pattern_data,
        material: pattern.material,
        savedPatternId: pattern.id,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">My Patterns</h1>
            <p className="mt-1 text-muted-foreground">
              {patterns.length} saved {patterns.length === 1 ? "pattern" : "patterns"}
            </p>
          </div>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Plus className="h-4 w-4" /> New Pattern
          </Button>
        </div>

        {patterns.length === 0 ? (
          <Card className="border-dashed py-16 text-center">
            <CardContent>
              <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-2 font-serif text-lg font-semibold">No patterns yet</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Upload a photo of an object and generate your first pattern.
              </p>
              <Button onClick={() => navigate("/upload")}>Create Your First Pattern</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {patterns.map((pattern, i) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="group cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => openPattern(pattern)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-serif text-lg">{pattern.name}</CardTitle>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete pattern?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{pattern.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePattern(pattern.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                        {pattern.material}
                      </span>
                      <span>
                        {(pattern.pattern_data as any)?.pieces?.length ?? 0} pieces
                      </span>
                      <span className="ml-auto text-xs">
                        {new Date(pattern.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {pattern.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {pattern.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyPatternsPage;
