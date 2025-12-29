import { MainLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewExamPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Exam</h1>
            <p className="text-muted-foreground">
              Create a new certification exam.
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Exam Details</CardTitle>
            <CardDescription>
              Enter the details for your new exam.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Exam Name
                </label>
                <Input
                  id="name"
                  placeholder="e.g., AWS Solutions Architect"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Input
                  id="description"
                  placeholder="e.g., AWS SAA-C03 certification exam"
                  disabled
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled>
                  Create Exam
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/exams">Cancel</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Form functionality will be implemented in Phase 2.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
