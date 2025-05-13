import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['nutrition', 'medical', 'fitness', 'wellness']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'questionable', 'refuted'],
    default: 'pending'
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  originalSource: {
    url: String,
    postDate: Date,
    platform: String,
    engagement: {
      likes: Number,
      comments: Number,
      shares: Number
    }
  },
  studies: [{
    title: String,
    authors: String,
    year: Number,
    journal: String,
    doi: String,
    conclusion: {
      type: String,
      enum: ['supports', 'refutes', 'inconclusive']
    },
    summary: String
  }],
  verificationNotes: String,
  expertOpinions: [{
    name: String,
    credentials: String,
    opinion: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar o updatedAt antes de cada atualização
claimSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

claimSchema.index({ influencerId: 1 });
claimSchema.index({ status: 1 });
claimSchema.index({ category: 1 });
claimSchema.index({ trustScore: -1 });
claimSchema.index({ createdAt: -1 });

export const ClaimModel = mongoose.model('Claim', claimSchema);