import { ClaimModel } from '../models/Claim.js';
import { trackDBQuery } from '../config/monitoring.js';

export const getAllClaims = async (req, res) => {
  const startTime = Date.now();
  try {
    const claims = await ClaimModel.find().populate('influencer');
    trackDBQuery('find', 'claims', (Date.now() - startTime) / 1000);
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get claim by ID
export const getClaimById = async (req, res) => {
  const startTime = Date.now();
  try {
    const claim = await ClaimModel.findById(req.params.id).populate('influencer');

    if (!claim) {
      return res.status(404).json({ message: 'Alegação não encontrada' });
    }

    trackDBQuery('findById', 'claims', (Date.now() - startTime) / 1000);

    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new claim
export const createClaim = async (req, res) => {
  const startTime = Date.now();
  try {
    const claim = new ClaimModel(req.body);
    const newClaim = await claim.save();

    trackDBQuery('create', 'claims', (Date.now() - startTime) / 1000);

    res.status(201).json(newClaim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update claim
export const updateClaim = async (req, res) => {
  const startTime = Date.now();
  try {
    const claim = await ClaimModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({ message: 'Alegação não encontrada' });
    }

    trackDBQuery('update', 'claims', (Date.now() - startTime) / 1000);

    res.json(claim);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete claim
export const deleteClaim = async (req, res) => {
  const startTime = Date.now();
  try {
    const claim = await ClaimModel.findByIdAndDelete(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Alegação não encontrada' });
    }

    trackDBQuery('delete', 'claims', (Date.now() - startTime) / 1000);

    res.json({ message: 'Alegação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};