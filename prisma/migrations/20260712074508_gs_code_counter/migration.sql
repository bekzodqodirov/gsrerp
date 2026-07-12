-- CreateTable
CREATE TABLE "gs_code_counter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "prefix" TEXT NOT NULL DEFAULT 'GS',
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "gs_code_counter_pkey" PRIMARY KEY ("id")
);
