import { Request, Response } from 'express';
import { bookService } from '../services';
import { bookModel } from '../models';
import { logger } from '../utils';

/**
 * Displaying the list of all active books (Public Catalog).
 */
export const getBooks = async (req: Request, res: Response) => {
  try {
    // Retrieving all active books
    const books = await bookService.getActiveBooks();

    // console.log(books);
    
    // Rendering the public book listing page
    res.render('pages/books', {
      pageTitle: 'Our Catalog',
      books,
    });
  } catch (error) {
    // Handling and logging errors
    console.error('Error fetching books:', error);
    res.status(500).render('pages/error', {
        pageTitle: 'Error',
        errorCode: 500,
        errorMessage: 'Could not load book catalog.',
        isAuthenticated: res.locals.isAuthenticated,
    });
  }
};

/**
 * Displaying details for a single book.
 */
// export const getBookDetails = async (req: Request, res: Response) => {
//   const { bookId } = req.params;
  
//   try {
//     // Retrieving the book by ID
//     const book = await bookService.getBookById(bookId);

//     if (!book || !book.is_active) {
//       // Handling book not found or inactive
//       return res.status(404).render('pages/error', {
//         pageTitle: 'Not Found',
//         errorCode: 404,
//         errorMessage: 'The requested book was not found.',
//         isAuthenticated: res.locals.isAuthenticated,
//       });
//     }

//     // Rendering the book details page
//     res.render('pages/bookDetails', {
//       pageTitle: book.title,
//       book,
//     });
//   } catch (error) {
//     console.error('Error fetching book details:', error);
//     res.status(500).send('Server Error');
//   }
// };

/**
 * Displaying the list of all active books (catalog) and handling search. (GET /books)
 */
// export const getBookCatalog = async (req: Request, res: Response) => {
//     const searchQuery = req.query.q as string || '';
    
//     try {
//         // NOTE: bookService.searchBooks needs to be implemented to handle search/listing
//         const books = await bookService.searchBooks(searchQuery);

//         res.render('pages/bookList', {
//             pageTitle: searchQuery ? `Search Results for "${searchQuery}"` : 'Book Catalog',
//             books,
//             searchQuery,
//         });
//     } catch (error) {
//         logger.error('Error fetching book catalog:', error);
//         res.status(500).send('Server Error loading catalog.');
//     }
// };

/**
 * Displaying the list of all active books (catalog), handling search, and category filtering. (GET /books)
 * Endpoint for: books listing, search page, filter page.
 */
export const getBookCatalog = async (req: Request, res: Response) => {
    const searchQuery = req.query.q as string || '';
    const categoryId = req.query.category ? parseInt(req.query.category as string, 10) : undefined;
    
    try {
        //  Fetching all categories for the filter sidebar
        const categories = await bookService.getCategories();

        //  Fetching books based on search query OR category filter
        const books = await bookService.searchBooks(searchQuery, categoryId);

        //  Determine the current page title
        let pageTitle = 'Book Catalog';
        let currentCategoryName = '';
        
        if (searchQuery) {
            pageTitle = `Search Results for "${searchQuery}"`;
        } else if (categoryId) {
            const category = await bookModel.findCategoryById(categoryId);
            if (category) {
                currentCategoryName = category.category_name;
                pageTitle = `${currentCategoryName} Books`;
            } else {
                pageTitle = 'Filtered Catalog';
            }
        }
        
        res.render('pages/bookList', {
            pageTitle,
            books,
            categories, // For sidebar filters
            searchQuery,
            currentCategoryId: categoryId,
            currentCategoryName,
        });
    } catch (error) {
        logger.error('Error fetching book catalog/search:', error);
        res.status(500).send('Server Error loading catalog.');
    }
};

/**
 * Displaying the book details page. (GET /books/:bookId)
 */
export const getBookDetails = async (req: Request, res: Response) => {
    const { bookId } = req.params;
    
    try {
        const book = await bookService.getBookById(bookId);

        if (!book || !book.is_active) {
            return res.status(404).render('pages/error', {
                pageTitle: 'Book Not Found',
                errorCode: 404,
                errorMessage: 'The book you are looking for is not available or does not exist.',
                isAuthenticated: res.locals.isAuthenticated,
            });
        }
        
        res.render('pages/bookDetails', {
            pageTitle: book.title,
            book,
        });
    } catch (error) {
        logger.error(`Error fetching book details ${bookId}:`, error);
        res.status(500).send('Server Error loading book details.');
    }
};