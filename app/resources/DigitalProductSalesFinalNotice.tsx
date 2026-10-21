import { DIGITAL_PRODUCT_SALES_FINAL_NOTICE } from "@/lib/resources-shared";

type DigitalProductSalesFinalNoticeProps = {
  className?: string;
};

export default function DigitalProductSalesFinalNotice({
  className = "mt-2 text-xs leading-relaxed text-zinc-500",
}: DigitalProductSalesFinalNoticeProps) {
  return <p className={className}>{DIGITAL_PRODUCT_SALES_FINAL_NOTICE}</p>;
}
