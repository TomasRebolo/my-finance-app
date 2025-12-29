-- AlterTable
ALTER TABLE "BankConnection" ADD COLUMN     "consentId" TEXT;

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "credentialsType" TEXT NOT NULL,
    "media" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "statusUpdateAt" TIMESTAMP(3),
    "monitoring" JSONB NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "countryCode2" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("countryCode2")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "lastPrice" DECIMAL(18,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CountryToInstitution" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CountryToInstitution_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Investment_symbol_key" ON "Investment"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_userId_investmentId_key" ON "Holding"("userId", "investmentId");

-- CreateIndex
CREATE INDEX "_CountryToInstitution_B_index" ON "_CountryToInstitution"("B");

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToInstitution" ADD CONSTRAINT "_CountryToInstitution_A_fkey" FOREIGN KEY ("A") REFERENCES "Country"("countryCode2") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CountryToInstitution" ADD CONSTRAINT "_CountryToInstitution_B_fkey" FOREIGN KEY ("B") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
