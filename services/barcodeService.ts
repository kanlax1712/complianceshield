export interface BarcodeLookupResult {
  barcode: string;
  productName: string;
  brand: string;
  ingredientsText: string;
  categories: string;
  imageUrl?: string;
  expirationDate?: string;
  quantity?: string;
  countries?: string;
}

export const fetchProductInfoByBarcode = async (barcode: string): Promise<BarcodeLookupResult> => {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  if (!response.ok) {
    throw new Error("Barcode lookup failed. Please try again.");
  }
  const data = await response.json();
  if (!data || data.status !== 1 || !data.product) {
    throw new Error("Product not found for this barcode.");
  }

  const product = data.product;
  return {
    barcode,
    productName: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    ingredientsText: product.ingredients_text || product.ingredients_text_en || "",
    categories: product.categories || "",
    imageUrl: product.image_url || product.image_front_url,
    expirationDate: product.expiration_date || "",
    quantity: product.quantity || "",
    countries: product.countries || ""
  };
};
