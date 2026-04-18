import { prisma } from '../config/db.js';
import newrelic from 'newrelic';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

/**
 * Saves the GitHub provider token to the user record
 */
export const saveGithubToken = async (userId, token) => {
    return newrelic.startSegment('github_service:saveToken', true, async () => {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { githubToken: token }
            });
            logger.info('GitHub integration connected', { userId });
            return true;
        } catch (error) {
            logger.error('Failed to save GitHub token', { userId, err: error.message });
            throw new AppError('Failed to save GitHub integration', 500);
        }
    });
};

/**
 * Disconnects GitHub from the user record
 */
export const disconnectGithub = async (userId) => {
    return newrelic.startSegment('github_service:disconnect', true, async () => {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { githubToken: null }
            });
            logger.info('GitHub integration disconnected', { userId });
            return true;
        } catch (error) {
            logger.error('Failed to disconnect GitHub', { userId, err: error.message });
            throw new AppError('Failed to disconnect GitHub', 500);
        }
    });
};

/**
 * Fetches the user's public repositories from GitHub API
 */
export const fetchUserRepos = async (userId) => {
    return newrelic.startSegment('github_service:fetchRepos', true, async () => {
        // Retrieve token
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { githubToken: true }
        });

        if (!user || !user.githubToken) {
            throw new AppError('GitHub is not connected', 400);
        }

        const token = user.githubToken;

        try {
            // Fetch public repositories specifically
            const response = await fetch('https://api.github.com/user/repos?visibility=public&affiliation=owner,collaborator&sort=updated&per_page=100', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'MiniVercel-Deploy-Platform'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or revoked
                    await disconnectGithub(userId);
                    throw new AppError('GitHub token expired or revoked. Please reconnect.', 401);
                }
                throw new Error(`GitHub API returned ${response.status} ${response.statusText}`);
            }

            const repos = await response.json();
            
            // Map the data into a simplified, easy to consume format for the frontend
            const formattedRepos = repos.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                private: repo.private,
                description: repo.description,
                cloneUrl: repo.clone_url,      // Useful for simple-git operations
                htmlUrl: repo.html_url,        // Useful for UI linking
                language: repo.language,
                updatedAt: repo.updated_at,
                pushedAt: repo.pushed_at,
                owner: {
                    login: repo.owner.login,
                    avatarUrl: repo.owner.avatar_url
                }
            }));

            // Optional: New Relic Custom Event for Business Intelligence
            newrelic.recordCustomEvent('GithubReposFetched', {
                userId,
                repoCount: formattedRepos.length
            });

            return formattedRepos;

        } catch (error) {
            if (error instanceof AppError) throw error;
            
            logger.error('GitHub API error', { userId, err: error.message });
            throw new AppError('Failed to fetch repositories from GitHub', 502);
        }
    });
};
