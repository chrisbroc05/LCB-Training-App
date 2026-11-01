-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_commissionAttributionOrgId_fkey" FOREIGN KEY ("commissionAttributionOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
