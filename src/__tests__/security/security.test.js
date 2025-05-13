import { expect } from 'chai';
import sinon from 'sinon';
import { validateApiKey, sanitizeRequest, securityHeaders } from '../middleware/security.js';

describe('Security Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: sinon.stub(),
      body: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      setHeader: sinon.stub(),
      removeHeader: sinon.stub()
    };
    next = sinon.spy();
  });

  describe('API Key Validation', () => {
    it('should pass with valid API key', () => {
      process.env.API_KEY = 'test-key';
      req.header.withArgs('X-API-Key').returns('test-key');
      
      validateApiKey(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should fail with invalid API key', () => {
      process.env.API_KEY = 'test-key';
      req.header.withArgs('X-API-Key').returns('wrong-key');
      
      validateApiKey(req, res, next);
      
      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
    });
  });

  describe('Request Sanitization', () => {
    it('should sanitize MongoDB injection attempts', () => {
      req.body = {
        $where: 'malicious code',
        field: { $gt: '' }
      };
      
      sanitizeRequest(req, res, next);
      
      expect(req.body).to.not.have.property('$where');
      expect(req.body.field).to.not.have.property('$gt');
    });
  });

  describe('Security Headers', () => {
    it('should set all required security headers', () => {
      securityHeaders(req, res, next);
      
      expect(res.removeHeader.calledWith('X-Powered-By')).to.be.true;
      expect(res.setHeader.calledWith('X-Frame-Options', 'DENY')).to.be.true;
      expect(res.setHeader.calledWith('X-XSS-Protection', '1; mode=block')).to.be.true;
      expect(res.setHeader.calledWith('X-Content-Type-Options', 'nosniff')).to.be.true;
    });
  });
});