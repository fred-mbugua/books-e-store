import { bookModel, actionLogModel } from '../models';
import { Book } from '../types/book';

/**
 * Fetching all active books for public listing.
 */
export const getActiveBooks = async (): Promise<Book[]> => {
  // Retrieving all active books
  return bookModel.findAllBooks();
};

/**
 * Fetching all books for the admin view.
 */
export const getBooksForAdmin = async (): Promise<Book[]> => {
  // Retrieving all books (including inactive)
  return bookModel.findBooksForAdmin();
};

/**
 * Creating a new book and logging the action.
 */
export const addNewBook = async (
  data: Omit<Book, 'book_id' | 'created_at' | 'updated_at'>,
  userId: string,
): Promise<Book> => {
  // Converting price and stock to appropriate types
  const parsedData = {
    ...data,
    price: Number(data.price),
    stock_quantity: Number(data.stock_quantity),
  };
  
  // Storing the book in the database
  const bookId = await bookModel.createBook(parsedData);

  // Storing an action log for book creation
  await actionLogModel.createActionLog({
    userId,
    actionType: 'BOOK_CREATED',
    details: { bookId, title: data.title, price: data.price },
  });

  return bookId;
};

/**
 * Updating an existing book and logging the action.
 */
export const updateExistingBook = async (
  bookId: string,
  data: Partial<Book>,
  userId: string,
): Promise<boolean> => {
  // Updating the book record
  const success = await bookModel.updateBook(bookId, data);
  
  // Checking if the update was successful and logging
  if (success) {
    // Storing an action log for book update
    await actionLogModel.createActionLog({
      userId,
      actionType: 'BOOK_UPDATED',
      details: { bookId, changes: data },
    });
  }

  return success;
};

/**
 * Deleting a book (soft delete) and logging the action.
 */
export const removeBook = async (bookId: string, userId: string): Promise<boolean> => {
  // Deleting the book
  const success = await bookModel.deleteBook(bookId);
  
  // Checking if deletion was successful and logging
  if (success) {
    // Storing an action log for book deletion
    await actionLogModel.createActionLog({
      userId,
      actionType: 'BOOK_DELETED',
      details: { bookId },
    });
  }

  return success;
};

/**
 * Fetching a book by ID.
 */
export const getBookById = async (bookId: string): Promise<Book | null> => {
  // Retrieving a single book by ID
  return bookModel.findBookById(bookId);
};

/**
 * Searching and listing active books based on a query, or listing all active books if the query is empty.
 * Delegates all data retrieval logic to the bookModel.
 */
// export const searchBooks = async (query: string): Promise<any[]> => {
//     const sanitizedQuery = query ? query.trim() : '';

//     if (!sanitizedQuery) {
//         // If no query, return all active books (delegating to model)
//         return bookModel.findAllActiveBooks();
//     }

//     // Call the model function that handles the query logic
//     return bookModel.searchActiveBooks(sanitizedQuery);
// };

/**
 * Fetches all distinct categories used by active books.
 */
export const getCategories = async (): Promise<any[]> => {
    return bookModel.findAllCategories();
};

/**
 * Searching and listing active books based on a query or category filter.
 */
export const searchBooks = async (query: string, categoryId?: number): Promise<any[]> => {
    const sanitizedQuery = query ? query.trim() : '';

    if (categoryId) {
        // If a category filter is applied, ignore search query and filter by category
        return bookModel.findActiveBooksByCategory(categoryId);
    }
    
    if (!sanitizedQuery) {
        // If neither query nor filter is applied, return all active books
        return bookModel.findAllActiveBooks();
    }

    // Otherwise, perform the text search
    return bookModel.searchActiveBooks(sanitizedQuery);
};