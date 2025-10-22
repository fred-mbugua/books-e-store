import { query } from './db';
import { Book } from '../types'; // We'll define the Book type next

/**
 * Creating a new book record in the database.
 */
export const createBook = async (data: Omit<Book, 'book_id' | 'created_at' | 'updated_at'>): Promise<Book> => {
  // Inserting a new book record
  const sql = `
    INSERT INTO books (title, author, isbn, description, price, stock_quantity, image_url, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING book_id;
  `;
  const params = [
    data.title,
    data.author,
    data.isbn,
    data.description,
    data.price,
    data.stock_quantity,
    data.image_url,
    data.is_active,
  ];

  const result = await query(sql, params);
    // Constructing the book object
    const book: Book = {
      book_id: result.rows[0].book_id,
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
    };
    // Returning the newly created book

  return book;
};

/**
 * Retrieving all books from the database.
 */
export const findAllBooks = async (): Promise<Book[]> => {
  // Selecting all active books, ordered by title
  const sql = 'SELECT * FROM books WHERE is_active = TRUE ORDER BY title ASC';
  const result = await query(sql);
  // Returning the list of books
  return result.rows as Book[];
};

/**
 * Finding a book by its UUID.
 */
export const findBookById = async (bookId: string): Promise<Book | null> => {

  console.log('Finding book by ID:', bookId);
  // Selecting a book by its ID
  const sql = `
      Select
          bks.book_id,
          bks.title,
          bks.author,
          bks.isbn,
          bks.description,
          bks.price,
          bks.stock_quantity,
          bks.image_url,
          bks.is_active,
          bks.created_at,
          bks.updated_at,
          categories.category_name
      From
          books bks Inner Join
          categories On bks.category_id = categories.category_id 
      WHERE bks.book_id = $1`;
  const result = await query(sql, [bookId]);
  // Returning the book or null
  return result.rows[0] || null;
};

/**
 * Updating an existing book's details.
 */
export const updateBook = async (bookId: string, data: Partial<Book>): Promise<boolean> => {
  // Creating dynamic SQL update statement
  const fields = Object.keys(data).map((key, index) => `${key} = $${index + 2}`).join(', ');
  
  if (!fields) return false;

  const sql = `
    UPDATE books
    SET ${fields}, updated_at = CURRENT_TIMESTAMP
    WHERE book_id = $1
    RETURNING book_id;
  `;
  const params = [bookId, ...Object.values(data)];

  const result = await query(sql, params);
  // Returning true if a row was updated
  return (result.rowCount ?? 0) > 0;
};

/**
 * Deleting a book (soft delete by setting is_active to FALSE).
 */
export const deleteBook = async (bookId: string): Promise<boolean> => {
  // Performing a soft delete on the book
  const sql = 'UPDATE books SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE book_id = $1 RETURNING book_id;';
  const result = await query(sql, [bookId]);
  // Returning true if a row was affected
  return (result.rowCount ?? 0) > 0;
};

/**
 * Retrieving books for the Admin Dashboard (including inactive ones).
 */
export const findBooksForAdmin = async (): Promise<Book[]> => {
    // Selecting all books, including inactive ones
    const sql = 'SELECT * FROM books ORDER BY created_at DESC';
    const result = await query(sql);
    // Returning the list of all books
    return result.rows as Book[];
};

/**
 * Searching and listing active books based on a query across title, author, and ISBN.
 */
export const searchActiveBooks = async (searchTerm: string): Promise<any[]> => {
    // Preparing the search term for LIKE comparison (case-insensitive)
    const dbSearchTerm = `%${searchTerm.toLowerCase()}%`;
    
    const sql = `
        SELECT 
            book_id, title, author, isbn, price, image_url, description, stock_quantity
        FROM books
        WHERE is_active = TRUE 
        AND (
            LOWER(title) LIKE $1 
            OR LOWER(author) LIKE $1
            OR LOWER(isbn) LIKE $1
        )
        ORDER BY title ASC;
    `;
    
    // Execute the query within the model layer
    const result = await query(sql, [dbSearchTerm]);
    return result.rows;
};

/**
 * Retrieving all active books for display in the public catalog.
 */
export const findAllActiveBooks = async (): Promise<any[]> => {
    const sql = `
        SELECT 
            book_id, title, author, isbn, price, image_url, description, stock_quantity
        FROM books
        WHERE is_active = TRUE 
        ORDER BY created_at DESC;
    `;
    
    const result = await query(sql);
    return result.rows;
};

/**
 * Retrieving a list of all distinct categories used by active books.
 */
export const findAllCategories = async (): Promise<{ category_id: number, category_name: string }[]> => {
    const sql = `
        SELECT DISTINCT c.category_id, c.category_name
        FROM categories c
        JOIN books b ON c.category_id = b.category_id
        WHERE b.is_active = TRUE
        ORDER BY c.category_name ASC;
    `;
    const result = await query(sql);
    return result.rows;
};

/**
 * Retrieving all active books filtered by a specific category ID.
 */
export const findActiveBooksByCategory = async (categoryId: number): Promise<any[]> => {
    const sql = `
        SELECT 
            book_id, title, author, isbn, price, image_url, description, stock_quantity
        FROM books
        WHERE is_active = TRUE AND category_id = $1
        ORDER BY created_at DESC;
    `;
    const result = await query(sql, [categoryId]);
    return result.rows;
};

/**
 * Retrieving a category by ID.
 */
export const findCategoryById = async (categoryId: number): Promise<{ category_name: string } | null> => {
    const sql = 'SELECT category_name FROM categories WHERE category_id = $1';
    const result = await query(sql, [categoryId]);
    return result.rows[0] || null;
};