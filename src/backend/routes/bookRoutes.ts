import { Router } from 'express';
import * as bookController from '../controllers/bookController';

const router = Router();

// Book Catalog (List/Search/Filter: GET /books or /books?q=term or /books?category=ID)
router.get('/', bookController.getBookCatalog);

// Book Details
router.get('/:bookId', bookController.getBookDetails);

export default router;