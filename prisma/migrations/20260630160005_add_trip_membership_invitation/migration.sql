-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PLANNING', 'VOTING', 'FINALIZED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TripRole" AS ENUM ('OWNER', 'MEMBER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "TripStatus" NOT NULL DEFAULT 'PLANNING',
    "finalDestinationId" TEXT,
    "finalStartDate" TIMESTAMP(3),
    "finalEndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripMembership" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TripRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACCEPTED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripInvitation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripMembership_tripId_userId_key" ON "TripMembership"("tripId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TripInvitation_token_key" ON "TripInvitation"("token");

-- AddForeignKey
ALTER TABLE "TripMembership" ADD CONSTRAINT "TripMembership_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMembership" ADD CONSTRAINT "TripMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripInvitation" ADD CONSTRAINT "TripInvitation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
