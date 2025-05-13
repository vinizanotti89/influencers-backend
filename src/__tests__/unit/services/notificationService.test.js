import { expect } from 'chai';
import sinon from 'sinon';
import NotificationService from '../../../services/NotificationService.js';
import User from '../../../models/User.js';

describe('Notification Service Tests', () => {
  let notificationService;
  let mockUser;

  beforeEach(() => {
    notificationService = new NotificationService();
    mockUser = {
      _id: '123',
      email: 'test@example.com',
      notifications: []
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('sendNotification', () => {
    it('should create and save notification successfully', async () => {
      const notification = {
        type: 'CLAIM_UPDATE',
        message: 'New claim status update',
        userId: mockUser._id
      };

      const saveStub = sinon.stub(User, 'findByIdAndUpdate').resolves(mockUser);

      const result = await notificationService.sendNotification(notification);

      expect(result).to.be.true;
      expect(saveStub.calledOnce).to.be.true;
      expect(saveStub.firstCall.args[1].$push.notifications).to.exist;
    });

    it('should handle failed notification creation', async () => {
      const notification = {
        type: 'CLAIM_UPDATE',
        message: 'New claim status update',
        userId: 'invalid-id'
      };

      sinon.stub(User, 'findByIdAndUpdate').rejects(new Error('Database error'));

      try {
        await notificationService.sendNotification(notification);
        expect.fail('Should throw error');
      } catch (error) {
        expect(error.message).to.equal('Database error');
      }
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const mockNotifications = [
        { type: 'CLAIM_UPDATE', message: 'Update 1', createdAt: new Date() },
        { type: 'SYSTEM', message: 'Update 2', createdAt: new Date() }
      ];

      sinon.stub(User, 'findById').resolves({
        ...mockUser,
        notifications: mockNotifications
      });

      const result = await notificationService.getNotifications(mockUser._id);

      expect(result).to.have.length(2);
      expect(result[0].type).to.equal('CLAIM_UPDATE');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = '456';
      const updateStub = sinon.stub(User, 'findOneAndUpdate').resolves(mockUser);

      await notificationService.markAsRead(mockUser._id, notificationId);

      expect(updateStub.calledOnce).to.be.true;
      expect(updateStub.firstCall.args[1]['notifications.$.read']).to.be.true;
    });
  });
});