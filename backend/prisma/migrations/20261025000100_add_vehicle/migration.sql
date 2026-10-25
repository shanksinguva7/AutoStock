-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

