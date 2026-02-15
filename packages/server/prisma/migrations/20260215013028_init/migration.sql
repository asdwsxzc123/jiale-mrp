-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CurrencyCode" AS ENUM ('MYR', 'RMB', 'USD');

-- CreateEnum
CREATE TYPE "StockTransactionType" AS ENUM ('RECEIVED', 'ISSUE', 'ADJUSTMENT', 'TRANSFER', 'ASSEMBLY', 'DISASSEMBLY');

-- CreateEnum
CREATE TYPE "SalesDocumentType" AS ENUM ('QUOTATION', 'SALES_ORDER', 'DELIVERY_ORDER', 'INVOICE', 'CASH_SALE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELLED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "PurchaseDocumentType" AS ENUM ('REQUEST', 'ORDER', 'GOODS_RECEIVED', 'INVOICE', 'CASH_PURCHASE', 'RETURNED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'PASSED', 'REJECTED', 'CONCESSION');

-- CreateEnum
CREATE TYPE "HandlingMethod" AS ENUM ('RETURN', 'REPLENISH', 'CONCESSION', 'SCRAP');

-- CreateEnum
CREATE TYPE "JobOrderStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('IN_STOCK', 'CONSUMED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "FinishedProductStatus" AS ENUM ('IN_STOCK', 'SHIPPED', 'RESERVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "category" TEXT,
    "nationality" TEXT,
    "reg_no" TEXT,
    "attention" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "outstanding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_branches" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "address_1" TEXT,
    "address_2" TEXT,
    "address_3" TEXT,
    "address_4" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "email" TEXT,

    CONSTRAINT "customer_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "supplier_category" TEXT,
    "nationality" TEXT,
    "industries_code" TEXT,
    "reg_no" TEXT,
    "attention" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "outstanding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_branches" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "address_1" TEXT,
    "address_2" TEXT,
    "address_3" TEXT,
    "address_4" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "email" TEXT,

    CONSTRAINT "supplier_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "stock_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "stock_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "stock_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "group_id" TEXT,
    "category_id" TEXT,
    "base_uom" TEXT NOT NULL DEFAULT 'KG',
    "reorder_level" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reorder_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lead_time" INTEGER NOT NULL DEFAULT 0,
    "ref_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ref_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "shelf" TEXT,
    "output_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "input_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "stock_control" BOOLEAN NOT NULL DEFAULT true,
    "serial_no_tracking" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_item_uoms" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "rate" DECIMAL(15,4) NOT NULL DEFAULT 1,
    "ref_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ref_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_base" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stock_item_uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_balances" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "type" "StockTransactionType" NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location_from_id" TEXT,
    "location_to_id" TEXT,
    "ref_document_type" TEXT,
    "ref_document_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "qty" DECIMAL(15,2) NOT NULL,
    "uom" TEXT NOT NULL,
    "unit_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "stock_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_documents" (
    "id" TEXT NOT NULL,
    "type" "SalesDocumentType" NOT NULL,
    "doc_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "date" DATE NOT NULL,
    "agent" TEXT,
    "terms" TEXT,
    "description" TEXT,
    "project" TEXT,
    "ref_no" TEXT,
    "ext_no" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "exchange_rate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "e_invoice_status" TEXT,
    "is_transferable" BOOLEAN NOT NULL DEFAULT true,
    "ref_doc_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_document_items" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "item_id" TEXT,
    "description" TEXT,
    "qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "uom" TEXT,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_code" TEXT,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "sales_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_documents" (
    "id" TEXT NOT NULL,
    "type" "PurchaseDocumentType" NOT NULL,
    "doc_no" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "date" DATE NOT NULL,
    "agent" TEXT,
    "terms" TEXT,
    "description" TEXT,
    "project" TEXT,
    "ref_no" TEXT,
    "ext_no" TEXT,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "exchange_rate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_transferable" BOOLEAN NOT NULL DEFAULT true,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "ref_doc_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_document_items" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "item_id" TEXT,
    "description" TEXT,
    "qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "uom" TEXT,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_code" TEXT,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "tax_inclusive" BOOLEAN NOT NULL DEFAULT false,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "planned_weight" DECIMAL(15,2),
    "actual_weight" DECIMAL(15,2),
    "planned_arrival_date" DATE,
    "actual_arrival_date" DATE,
    "payment_method" TEXT,
    "weight_unit" TEXT DEFAULT 'KG',

    CONSTRAINT "purchase_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payments" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "method" TEXT,
    "ref_no" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_deposits" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_debit_notes" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_debit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_notes" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_refunds" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "ref_payment_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_payments" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "method" TEXT,
    "ref_no" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_deposits" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_debit_notes" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_debit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_credit_notes" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MYR',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_refunds" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "ref_payment_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incoming_inspections" (
    "id" TEXT NOT NULL,
    "purchase_doc_id" TEXT NOT NULL,
    "purchase_doc_item_id" TEXT,
    "item_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "inspection_date" DATE NOT NULL,
    "wrong_item" BOOLEAN NOT NULL DEFAULT false,
    "wrong_item_description" TEXT,
    "weight_difference" DECIMAL(15,2),
    "handling_method" "HandlingMethod",
    "handling_notes" TEXT,
    "inspector_id" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incoming_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "product_item_id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'V1.0',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_items" (
    "id" TEXT NOT NULL,
    "bom_id" TEXT NOT NULL,
    "material_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "uom" TEXT NOT NULL,
    "is_sub_assembly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bom_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_orders" (
    "id" TEXT NOT NULL,
    "doc_no" TEXT NOT NULL,
    "product_item_id" TEXT NOT NULL,
    "bom_id" TEXT,
    "planned_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "completed_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "color" TEXT,
    "planned_weight" DECIMAL(15,2),
    "actual_weight" DECIMAL(15,2),
    "yield_rate" DECIMAL(5,2),
    "production_cycle" INTEGER,
    "planned_start" DATE,
    "planned_end" DATE,
    "actual_start" DATE,
    "actual_end" DATE,
    "status" "JobOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_order_materials" (
    "id" TEXT NOT NULL,
    "job_order_id" TEXT NOT NULL,
    "material_item_id" TEXT NOT NULL,
    "required_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issued_qty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actual_used_weight" DECIMAL(15,2),
    "uom" TEXT NOT NULL,
    "raw_material_batch_id" TEXT,

    CONSTRAINT "job_order_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_batches" (
    "id" TEXT NOT NULL,
    "traceability_code" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "purchase_doc_id" TEXT,
    "purchase_doc_item_id" TEXT,
    "inspection_id" TEXT,
    "supplier_id" TEXT,
    "weight" DECIMAL(15,2) NOT NULL,
    "weight_unit" TEXT NOT NULL DEFAULT 'KG',
    "warehouse_location_id" TEXT,
    "received_date" DATE NOT NULL,
    "remaining_weight" DECIMAL(15,2) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_material_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_products" (
    "id" TEXT NOT NULL,
    "traceability_code" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "job_order_id" TEXT,
    "production_date" DATE,
    "color" TEXT,
    "weight" DECIMAL(15,2) NOT NULL,
    "weight_unit" TEXT NOT NULL DEFAULT 'KG',
    "warehouse_location_id" TEXT,
    "qr_code_data" JSONB,
    "status" "FinishedProductStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finished_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_product_materials" (
    "id" TEXT NOT NULL,
    "finished_product_id" TEXT NOT NULL,
    "raw_material_batch_id" TEXT NOT NULL,
    "used_weight" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "finished_product_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" "CurrencyCode" NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange_rate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "is_base" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "tax_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_number_sequences" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "format" TEXT NOT NULL DEFAULT '{prefix}-{number:5}',

    CONSTRAINT "doc_number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_groups_name_key" ON "stock_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_categories_name_key" ON "stock_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_locations_name_key" ON "stock_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_code_key" ON "stock_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_item_id_location_id_key" ON "stock_balances"("item_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_doc_no_key" ON "sales_documents"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_documents_doc_no_key" ON "purchase_documents"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_payments_doc_no_key" ON "customer_payments"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_deposits_doc_no_key" ON "customer_deposits"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_debit_notes_doc_no_key" ON "customer_debit_notes"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_notes_doc_no_key" ON "customer_credit_notes"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_refunds_doc_no_key" ON "customer_refunds"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_payments_doc_no_key" ON "supplier_payments"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_deposits_doc_no_key" ON "supplier_deposits"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_debit_notes_doc_no_key" ON "supplier_debit_notes"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_credit_notes_doc_no_key" ON "supplier_credit_notes"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_refunds_doc_no_key" ON "supplier_refunds"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "job_orders_doc_no_key" ON "job_orders"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_batches_traceability_code_key" ON "raw_material_batches"("traceability_code");

-- CreateIndex
CREATE UNIQUE INDEX "finished_products_traceability_code_key" ON "finished_products"("traceability_code");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tax_codes_code_key" ON "tax_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "doc_number_sequences_type_key" ON "doc_number_sequences"("type");

-- AddForeignKey
ALTER TABLE "customer_branches" ADD CONSTRAINT "customer_branches_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "stock_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "stock_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_item_uoms" ADD CONSTRAINT "stock_item_uoms_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "stock_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transaction_items" ADD CONSTRAINT "stock_transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "stock_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_document_items" ADD CONSTRAINT "sales_document_items_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "sales_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_documents" ADD CONSTRAINT "purchase_documents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_document_items" ADD CONSTRAINT "purchase_document_items_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "purchase_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_deposits" ADD CONSTRAINT "customer_deposits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_debit_notes" ADD CONSTRAINT "customer_debit_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_notes" ADD CONSTRAINT "customer_credit_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_refunds" ADD CONSTRAINT "customer_refunds_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_payments" ADD CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_deposits" ADD CONSTRAINT "supplier_deposits_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_debit_notes" ADD CONSTRAINT "supplier_debit_notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_credit_notes" ADD CONSTRAINT "supplier_credit_notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_refunds" ADD CONSTRAINT "supplier_refunds_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incoming_inspections" ADD CONSTRAINT "incoming_inspections_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_orders" ADD CONSTRAINT "job_orders_bom_id_fkey" FOREIGN KEY ("bom_id") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order_materials" ADD CONSTRAINT "job_order_materials_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_purchase_doc_id_fkey" FOREIGN KEY ("purchase_doc_id") REFERENCES "purchase_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "incoming_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_material_batches" ADD CONSTRAINT "raw_material_batches_warehouse_location_id_fkey" FOREIGN KEY ("warehouse_location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_job_order_id_fkey" FOREIGN KEY ("job_order_id") REFERENCES "job_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_warehouse_location_id_fkey" FOREIGN KEY ("warehouse_location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_product_materials" ADD CONSTRAINT "finished_product_materials_finished_product_id_fkey" FOREIGN KEY ("finished_product_id") REFERENCES "finished_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
