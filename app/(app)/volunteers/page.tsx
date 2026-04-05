import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function VolunteersPage() {
  const supabase = createServerClient();

  const { data: volunteers } = await supabase
    .from("users")
    .select("id, name, email, language, skills, availability, staffing, action")
    .eq("role", "volunteer")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Volunteers</h2>
        <p className="text-muted-foreground">
          {volunteers?.length ?? 0} registered volunteers
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Staffing</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(volunteers ?? []).map((v) => {
              const staffing = (v.staffing as string) ?? "available";
              const action = (v.action as string) ?? "idle";
              const staffingColors: Record<string, string> = {
                available: "bg-green-100 text-green-800",
                on_shift: "bg-blue-100 text-blue-800",
                delayed: "bg-yellow-100 text-yellow-800",
                committed: "bg-purple-100 text-purple-800",
                unavailable: "bg-red-100 text-red-800",
              };
              const actionColors: Record<string, string> = {
                idle: "bg-gray-100 text-gray-800",
                responding: "bg-blue-100 text-blue-800",
                on_scene: "bg-orange-100 text-orange-800",
                returning: "bg-yellow-100 text-yellow-800",
              };
              return (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.email}</div>
                  </TableCell>
                  <TableCell>{v.language}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {((v.skills as string[]) ?? []).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={staffingColors[staffing] ?? ""}
                    >
                      {staffing.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={actionColors[action] ?? ""}
                    >
                      {action.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
