import { Request, Response } from 'express';
import ReportService from '../services/reportService';

class ReportController {
    private reportService: ReportService;

    constructor() {
        this.reportService = new ReportService();
    }

    async getRevenueByMonth(req: Request, res: Response) {
        try {
            console.log('getRevenueByMonth called with query:', req.query);
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const data = await this.reportService.getRevenueByMonth(year);
            console.log('Monthly revenue data:', data);
            
            return res.json({
                success: true,
                data,
                meta: {
                    year,
                    type: 'monthly'
                }
            });
        } catch (error) {
            console.error('Error in getRevenueByMonth:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get monthly revenue data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getRevenueByQuarter(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            
            const data = await this.reportService.getRevenueByQuarter(year);
            
            return res.json({
                success: true,
                data,
                meta: {
                    year,
                    type: 'quarterly'
                }
            });
        } catch (error) {
            console.error('Error in getRevenueByQuarter:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get quarterly revenue data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getRevenueByYear(req: Request, res: Response) {
        try {
            const currentYear = new Date().getFullYear();
            const startYear = parseInt(req.query.startYear as string) || currentYear - 5;
            const endYear = parseInt(req.query.endYear as string) || currentYear;
            
            const data = await this.reportService.getRevenueByYear(startYear, endYear);
            
            return res.json({
                success: true,
                data,
                meta: {
                    startYear,
                    endYear,
                    type: 'yearly'
                }
            });
        } catch (error) {
            console.error('Error in getRevenueByYear:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get yearly revenue data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    async getTopRooms(req: Request, res: Response) {
        try {
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            const limit = parseInt(req.query.limit as string) || 5;
            
            const data = await this.reportService.getTopRooms(year, limit);
            
            return res.json({
                success: true,
                data,
                meta: {
                    year,
                    limit,
                    type: 'top_rooms'
                }
            });
        } catch (error) {
            console.error('Error in getTopRooms:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get top rooms data',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

export default ReportController;