// Defining the structure for book data
export interface Book {
  book_id: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}