import { ReportService } from '../services/reportService.js';
import logger from '../config/logger.js';

export class ReportController {
  /**
   * Gera um novo relatório
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async generateReport(req, res) {
    try {
      const { type, filters } = req.body;

      if (!type) {
        return res.status(400).json({ error: 'Report type is required' });
      }

      // Adicionar dados do usuário ao relatório, se autenticado
      const userId = req.user ? req.user.id : null;

      const report = await ReportService.generate(type, filters, userId);

      return res.json(report);
    } catch (error) {
      logger.error('Error generating report:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Recupera um relatório por ID
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await ReportService.getById(id);

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Verificar se o usuário tem acesso ao relatório
      if (req.user && report.userId && report.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.json(report);
    } catch (error) {
      logger.error(`Error getting report ${req.params.id}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Recupera todos os relatórios com filtragem
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async getReports(req, res) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      // Se o usuário estiver autenticado, buscar apenas seus relatórios
      if (req.user) {
        filters.userId = req.user.id;
      }

      const reports = await ReportService.getAll(filters);
      return res.json(reports);
    } catch (error) {
      logger.error('Error getting reports:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Exporta um relatório para um formato específico
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   */
  static async exportReport(req, res) {
    try {
      const { id, format } = req.params;

      // Verificar formato válido
      const validFormats = ['pdf', 'csv', 'xlsx'];
      if (!validFormats.includes(format)) {
        return res.status(400).json({ error: 'Invalid export format' });
      }

      // Verificar se o relatório existe
      const report = await ReportService.getById(id);

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Verificar se o usuário tem acesso ao relatório
      if (req.user && report.userId && report.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const exportedReport = await ReportService.export(id, format);

      // Definir cabeçalhos apropriados com base no formato
      let contentType = 'application/octet-stream';
      if (format === 'pdf') contentType = 'application/pdf';
      else if (format === 'csv') contentType = 'text/csv';
      else if (format === 'xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=report-${id}.${format}`);
      return res.send(exportedReport);
    } catch (error) {
      logger.error(`Error exporting report ${req.params.id}:`, error);
      return res.status(500).json({ error: error.message });
    }
  }
}