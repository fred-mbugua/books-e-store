import { Request, Response } from 'express';
import { bookService, orderService, reportingService } from '../services';
import { logger } from '../utils';

// Defining the roles that can access the admin features
const ADMIN_ROLES = [1, 2]; // 1: Admin, 2: ShopKeeper

/**
 * Displaying the main Admin Dashboard page.
 */
export const getDashboard = (req: Request, res: Response) => {
  // Rendering the admin dashboard view
  res.render('pages/admin/dashboard', {
    pageTitle: 'Admin Dashboard',
    userRole: req.user?.roleId, // Passing user role for dynamic view rendering
  });
};

// --- Book Management ---

/**
 * Displaying the list of all books (including inactive) for admin management.
 */
export const getAdminBooks = async (req: Request, res: Response) => {
  try {
    // Retrieving all books for management
    const books = await bookService.getBooksForAdmin();
    
    // Rendering the admin book list view
    res.render('pages/admin/books/list', {
      pageTitle: 'Manage Books',
      books,
    });
  } catch (error) {
    logger.error('Error fetching admin books:', error);
    res.status(500).send('Server Error');
  }
};

/**
 * Displaying the form for adding a new book.
 */
export const getAddBook = (req: Request, res: Response) => {
  // Rendering the book creation form
  res.render('pages/admin/books/form', {
    pageTitle: 'Add New Book',
    book: null, // No existing book data
    isEdit: false,
  });
};

/**
 * Handling the creation of a new book.
 */
export const postAddBook = async (req: Request, res: Response) => {
  // Ensuring the user is authenticated (checked by middleware, but TS needs it)
  if (!req.user) return res.redirect('/login');
  
  try {
    // Creating the new book using data from the form body
    const result = await bookService.addNewBook(req.body, req.user.userId);
    res.status(200).json({ message: 'Book added successfully', result});
    // Redirecting to the book list on success
    // res.redirect('/admin/books?status=created');
  } catch (error) {
    logger.error('Failed to create new book:', error);
    // Re-rendering the form with an error message
    res.render('pages/admin/books/form', {
      pageTitle: 'Add New Book',
      book: req.body,
      isEdit: false,
      error: 'Failed to add book. Please check inputs.',
    });
  }
};

/**
 * Handling book deletion (soft delete).
 */
export const postDeleteBook = async (req: Request, res: Response) => {
  // Ensuring the user is authenticated
  if (!req.user) return res.status(401).end();
  
  const { bookId } = req.body;

  try {
    // Removing the book
    const success = await bookService.removeBook(bookId, req.user.userId);
    
    if (success) {
      // Success response for AJAX/Form submission
      res.redirect('/admin/books?status=deleted');
    } else {
      res.status(404).send('Book not found.');
    }
  } catch (error) {
    logger.error(`Failed to delete book ${bookId}:`, error);
    res.status(500).send('Server error during deletion.');
  }

  
};

/**
 * Displaying the form for editing an existing book.
 */
export const getEditBook = async (req: Request, res: Response) => {
  const { bookId } = req.params;
  
  try {
    // Finding the existing book data
    const book = await bookService.getBookById(bookId);

    if (!book) {
      // Handling book not found
      return res.status(404).render('pages/error', {
        pageTitle: 'Not Found',
        errorCode: 404,
        errorMessage: 'The book you are trying to edit was not found.',
        isAuthenticated: res.locals.isAuthenticated,
      });
    }

    // Rendering the form populated with existing book data
    res.render('pages/admin/books/form', {
      pageTitle: `Edit Book: ${book.title}`,
      book,
      isEdit: true, // Flag indicating this is an edit operation
      error: null,
    });
  } catch (error) {
    logger.error(`Failed to get edit form for book ${bookId}:`, error);
    res.status(500).send('Server Error');
  }
};

/**
 * Handling the submission of an edited book form.
 */
export const postEditBook = async (req: Request, res: Response) => {
  if (!req.user) return res.redirect('/login');
  
  const { bookId } = req.params;
  const { title, author, isbn, description, price, stock_quantity, image_url, is_active } = req.body;
  
  // Constructing the update data object
  const updateData = {
    title, 
    author, 
    isbn, 
    description, 
    price: parseFloat(price), // Ensuring price is a number
    stock_quantity: parseInt(stock_quantity, 10), // Ensuring stock is an integer
    image_url, 
    is_active: is_active === 'on' || is_active === true, // Handling checkbox value
  };

  try {
    // Updating the existing book
    const success = await bookService.updateExistingBook(bookId, updateData, req.user.userId);
    
    if (success) {
      // Redirecting to the book list on success
      return res.redirect(`/admin/books?status=updated&bookId=${bookId}`);
    } else {
      // If update failed (e.g., book not found), try to fetch the book for error display
      const book = await bookService.getBookById(bookId);
      
      return res.status(400).render('pages/admin/books/form', {
        pageTitle: 'Edit Book Failed',
        book: book || req.body,
        isEdit: true,
        error: 'Update failed. Book may not exist or data is invalid.',
      });
    }

  } catch (error) {
    logger.error(`Failed to update book ${bookId}:`, error);
    // Re-rendering the form with input data and error
    res.status(500).render('pages/admin/books/form', {
      pageTitle: 'Edit Book Error',
      book: { ...req.body, book_id: bookId },
      isEdit: true,
      error: (error as Error).message || 'Server error during update.',
    });
  }
};

/**
 * Displaying the list of all orders for admin management.
 */
export const getAdminOrders = async (req: Request, res: Response) => {
    try {
        const orders = await orderService.getAdminOrderList();
        
        res.render('pages/admin/orders/list', {
            pageTitle: 'Manage Orders',
            orders,
        });
    } catch (error) {
        logger.error('Error fetching admin orders:', error);
        res.status(500).send('Server Error');
    }
};

/**
 * Displaying the details of a single order and providing a status update form.
 */
export const getOrderDetails = async (req: Request, res: Response) => {
    const { orderId } = req.params;
    
    try {
        const result = await orderService.getOrderDetailAndStatuses(orderId);

        if (!result) {
            return res.status(404).send('Order not found.');
        }

        res.render('pages/admin/orders/details', {
            pageTitle: `Order #${orderId.substring(0, 8)}`,
            order: result.order,
            allStatuses: result.allStatuses,
            message: req.query.message, // For success/error messages after update
        });
    } catch (error) {
        logger.error(`Error fetching order details ${orderId}:`, error);
        res.status(500).send('Server Error');
    }
};

/**
 * Handling the submission to update the order status.
 */
export const postUpdateOrderStatus = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).end();

    const { orderId } = req.params;
    const { status_id } = req.body;
    
    try {
        const success = await orderService.updateOrderAndNotify(orderId, parseInt(status_id, 10), req.user.userId);

        if (success) {
            res.redirect(`/admin/orders/${orderId}?message=status_updated`);
        } else {
            res.redirect(`/admin/orders/${orderId}?message=update_failed`);
        }
    } catch (error) {
        logger.error(`Failed to update status for order ${orderId}:`, error);
        res.redirect(`/admin/orders/${orderId}?message=server_error`);
    }
};

/**
 * Displaying the reports landing page (Role ID 1: Admin only).
 */
export const getReportsPage = (req: Request, res: Response) => {
    res.render('pages/admin/reports/dashboard', {
        pageTitle: 'Reports Dashboard',
    });
};

/**
 * Handling Excel Report generation based on type.
 */
export const getGenerateReport = async (req: Request, res: Response) => {
    const { type } = req.query; // e.g., ?type=sales

    try {
        switch (type) {
            case 'sales':
                await reportingService.generateSalesReport(res);
                break;
            case 'users':
                await reportingService.generateUserReport(res);
                break;
            case 'orders':
                await reportingService.generateDetailedOrderReport(res);
                break;
            default:
                res.status(400).send('Invalid report type specified.');
                break;
        }
    } catch (error) {
        logger.error(`Error generating report type ${type}:`, error);
        res.status(500).send(`Failed to generate report due to server error.`);
    }
};

/**
 * Helper function: Formats raw database order data for summary display.
 * This is an internal utility used only by other exported functions in this file.
 */
const formatOrderSummary = (orders: any[]): any[] => {
    return orders.map(order => ({
        id: order.order_id.substring(0, 8),
        customer: order.guest_name,
        date: new Date(order.created_at).toLocaleDateString(),
        status: order.status_name.toUpperCase(),
        amount: order.total_amount,
    }));
};