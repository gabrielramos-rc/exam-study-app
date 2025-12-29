import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ExamsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
            <p className="text-muted-foreground">
              Manage your certification exams.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/exams/new">
              <Plus className="mr-2 h-4 w-4" />
              New Exam
            </Link>
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No exams yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Create your first exam to start importing questions.
            </CardDescription>
            <Button asChild>
              <Link href="/admin/exams/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
