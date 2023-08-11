-- CreateTable
CREATE TABLE "UserSearch" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL,

    CONSTRAINT "UserSearch_pkey" PRIMARY KEY ("id")
);
