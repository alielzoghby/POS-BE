-- AlterTable
ALTER TABLE "products" ADD COLUMN     "original_unit_value" INTEGER,
ADD COLUMN     "parent_id" INTEGER;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;
