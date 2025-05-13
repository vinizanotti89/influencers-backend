import mongoose from 'mongoose';

const influencerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'youtube', 'linkedin', 'tiktok']
  },
  followers: {
    type: Number,
    default: 0
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100
  },
  thumbnailUrl: String,
  metrics: {
    engagement: Number,
    posts: Number,
    videos: Number,
    views: Number
  },
  category: {
    type: String,
    enum: ['Nutrição', 'Saúde Mental', 'Fitness', 'Viagem', 'Tecnologia', 'Moda', 'Beleza', 'Alimentação', 'Outro']
  },
  socialMedia: [{
    platform: String,
    username: String,
    url: String
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

export const Influencer = mongoose.model('Influencer', influencerSchema);