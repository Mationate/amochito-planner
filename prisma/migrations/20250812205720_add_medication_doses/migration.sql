-- CreateTable
CREATE TABLE "public"."medication_doses" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "takenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_doses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."medication_doses" ADD CONSTRAINT "medication_doses_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "public"."medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
