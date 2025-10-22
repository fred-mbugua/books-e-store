import { reportingModel } from '../models';
import { generateExcelReport } from '../utils';
import { Response } from 'express';

/**
 * Generating the Sales Report (Excel).
 */
export const generateSalesReport = async (res: Response) => {
    const data = await reportingModel.getSalesByDate();
    const headers = [
        { header: 'Date', key: 'sale_date', width: 15 },
        { header: 'Total Orders', key: 'total_orders', width: 15 },
        { header: 'Total Revenue (Ksh)', key: 'total_revenue', width: 20 },
    ];
    
    // Using the utility to stream the Excel report to the response
    const filePath = await generateExcelReport('Sales_Report', [{
        sheetName: 'Sales Data',
        headers,
        data
    }]);
    res.download(filePath, 'Sales_Report.xlsx', (err) => {
        if (err) console.error('Error downloading sales report:', err);
    });
};

/**
 * Generating the User Report (Excel).
 */
export const generateUserReport = async (res: Response) => {
    const data = await reportingModel.getAllUsersReport();
    const headers = [
        { header: 'User ID', key: 'user_id', width: 35 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'First Name', key: 'first_name', width: 15 },
        { header: 'Last Name', key: 'last_name', width: 15 },
        { header: 'Role', key: 'role_name', width: 15 },
        { header: 'Created At', key: 'created_at', width: 20 },
    ];
    
    const filePath = await generateExcelReport('Users_Report', [{
        sheetName: 'Users Data',
        headers,
        data
    }]);
    res.download(filePath, 'Users_Report.xlsx', (err) => {
        if (err) console.error('Error downloading users report:', err);
    });
};

/**
 * Generating the Detailed Order Report (Excel).
 */
export const generateDetailedOrderReport = async (res: Response) => {
    const data = await reportingModel.getAllOrdersReport();
    const headers = [
        { header: 'Order ID', key: 'order_id', width: 35 },
        { header: 'Status', key: 'current_status', width: 15 },
        { header: 'Customer Name', key: 'customer_name', width: 20 },
        { header: 'Customer Email', key: 'customer_email', width: 30 },
        { header: 'Total Amount (Ksh)', key: 'total_amount', width: 20 },
        { header: 'Shipping Address', key: 'shipping_address', width: 40 },
        { header: 'Created At', key: 'created_at', width: 20 },
    ];
    
    const filePath = await generateExcelReport('Orders_Report', [{
        sheetName: 'Orders Data',
        headers,
        data
    }]);
    res.download(filePath, 'Orders_Report.xlsx', (err) => {
        if (err) console.error('Error downloading orders report:', err);
    });
};