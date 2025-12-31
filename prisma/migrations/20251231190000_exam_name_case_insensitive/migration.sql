-- DropIndex (case-sensitive)
DROP INDEX "Exam_name_key";

-- CreateIndex (case-insensitive using LOWER function)
CREATE UNIQUE INDEX "Exam_name_key" ON "Exam" (LOWER("name"));
