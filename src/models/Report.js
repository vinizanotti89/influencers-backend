import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['influencer', 'monthly', 'category']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  filters: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'error'],
    default: 'pending'
  },
  exportFormats: [{
    type: String,
    enum: ['pdf', 'csv', 'xlsx']
  }]
});

export const Report = mongoose.model('Report', reportSchema);
export default Report;