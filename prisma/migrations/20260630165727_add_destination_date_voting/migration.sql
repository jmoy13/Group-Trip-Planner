-- CreateTable
CREATE TABLE "DestinationOption" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "imageUrl" TEXT,
    "proposedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationVote" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DestinationVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateOption" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateOptionVote" (
    "id" TEXT NOT NULL,
    "dateOptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateOptionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationVote_destinationId_userId_key" ON "DestinationVote"("destinationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DateOptionVote_dateOptionId_userId_key" ON "DateOptionVote"("dateOptionId", "userId");

-- AddForeignKey
ALTER TABLE "DestinationOption" ADD CONSTRAINT "DestinationOption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationVote" ADD CONSTRAINT "DestinationVote_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "DestinationOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationVote" ADD CONSTRAINT "DestinationVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateOption" ADD CONSTRAINT "DateOption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateOptionVote" ADD CONSTRAINT "DateOptionVote_dateOptionId_fkey" FOREIGN KEY ("dateOptionId") REFERENCES "DateOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateOptionVote" ADD CONSTRAINT "DateOptionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
