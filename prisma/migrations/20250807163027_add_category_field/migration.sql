-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('WORK', 'STUDY', 'FINANCE', 'HEALTH', 'SOCIAL', 'ENTERTAINMENT', 'SHOPPING', 'TRAVEL', 'PERSONAL', 'OTHER');

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "category" "public"."Category" NOT NULL DEFAULT 'OTHER';
