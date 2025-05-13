import { expect } from 'chai';
import sinon from 'sinon';
import { verifyToken, checkRole } from '../../../middleware/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.spy();
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', () => {
      const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken(req, res, next);
      
      expect(next.calledOnce).to.be.true;
      expect(req.user).to.have.property('userId', '123');
    });

    it('should reject invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      verifyToken(req, res, next);
      
      expect(res.status.calledWith(401)).to.be.true;
      expect(next.called).to.be.false;
    });
  });

  describe('checkRole', () => {
    it('should allow access for correct role', () => {
      req.user.role = 'admin';
      const middleware = checkRole(['admin']);
      
      middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
    });

    it('should deny access for incorrect role', () => {
      req.user.role = 'user';
      const middleware = checkRole(['admin']);
      
      middleware(req, res, next);
      
      expect(res.status.calledWith(403)).to.be.true;
    });
  });
});