export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  warrantyMonths: number;
  returnable: boolean;
  specifications: Record<string, string>;
  reviewSummary?: string;
}
