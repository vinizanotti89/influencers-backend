import axios from 'axios';
import logger from '../config/logger.js';

// Exportando as funções diretamente em vez de uma classe
export const getInstagramProfile = async (req, res) => {
    try {
        // Token de acesso pode vir da requisição ou do usuário autenticado
        const token = req.headers.authorization?.split(' ')[1] || req.headers.token;
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        // Faz requisição à API do Instagram
        const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,media_count&access_token=${token.accessToken}`);
        return res.json(response.data);
    } catch (error) {
        logger.error('Instagram profile error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const analyzeInstagramProfile = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Simplificado para teste
        return res.json({
            username,
            platform: 'instagram',
            followers: 10000,
            message: 'Análise de perfil simulada'
        });
    } catch (error) {
        logger.error(`Instagram analysis error for ${req.params.username}:`, error);
        return res.status(500).json({ error: error.message });
    }
};

export const getYouTubeChannel = async (req, res) => {
    try {
        // Simplificado para teste
        return res.json({
            message: 'Canal do YouTube simulado'
        });
    } catch (error) {
        logger.error('YouTube channel error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const analyzeYouTubeChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        return res.json({
            channelId,
            platform: 'youtube',
            message: 'Análise de canal simulada'
        });
    } catch (error) {
        logger.error(`YouTube analysis error:`, error);
        return res.status(500).json({ error: error.message });
    }
};

export const getLinkedInProfile = async (req, res) => {
    try {
        return res.json({
            message: 'Perfil LinkedIn simulado'
        });
    } catch (error) {
        logger.error('LinkedIn profile error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const analyzeLinkedInProfile = async (req, res) => {
    try {
        const { username } = req.params;
        return res.json({
            username,
            platform: 'linkedin',
            message: 'Análise de perfil LinkedIn simulada'
        });
    } catch (error) {
        logger.error(`LinkedIn analysis error:`, error);
        return res.status(500).json({ error: error.message });
    }
};

export const getConnections = async (req, res) => {
    try {
        return res.json({
            connections: ['instagram', 'youtube', 'linkedin']
        });
    } catch (error) {
        logger.error('Get connections error:', error);
        return res.status(500).json({ error: error.message });
    }
};

export const analyzeLinkedInInfluencer = async (req, res) => {
    try {
        return res.json({
            message: 'Análise de influenciador LinkedIn simulada'
        });
    } catch (error) {
        logger.error('LinkedIn influencer error:', error);
        return res.status(500).json({ error: error.message });
    }
};

