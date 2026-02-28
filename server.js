const express = require('express');
const { sendEmail } = require('./emailService');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Parse JSON bodies
app.use(express.json());

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/send-welcome-email
 *
 * Endpoint to send a welcome email to a new user.
 * Expects a JSON body with an 'email' field.
 *
 * @name SendWelcomeEmail
 * @route {POST} /api/send-welcome-email
 * @bodyparam {string} email - The user's email address.
 * @response {200} message - Success message.
 * @response {400} error - Error message if email is missing.
 * @response {500} error - Error message if email sending fails.
 */
app.post('/api/send-welcome-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Save email to Supabase
        const { error: dbError } = await supabase
            .from('landing_page_emails')
            .insert([{ email }]);

        // Ignore error '23505' (duplicate unique key) because the user might just want to resend the email
        if (dbError && dbError.code !== '23505') {
            console.error('Supabase insert error:', dbError);
            return res.status(500).json({ error: 'Failed to save email' });
        }

        const subject = 'Welcome to Netflix Clone!';
        const text = 'Thanks for signing up! Enjoy unlimited movies and TV shows.';
        await sendEmail(email, subject, text);
        res.status(200).json({ message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Email service error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

/**
 * POST /api/auth/signup
 * Endpoint for user registration using Supabase Auth
 */
app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(200).json({ message: 'Signup successful!', user: data.user });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error during signup' });
    }
});

/**
 * POST /api/auth/signin
 * Endpoint for user login using Supabase Auth
 */
app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        let userType = 'PREMIUM'; // Default value
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', data.session.user.id)
                .single();
            if (profile && profile.user_type) {
                userType = profile.user_type.toUpperCase();
            }
        } catch (e) {
            console.error('Error fetching profile:', e);
        }

        res.status(200).json({ message: 'Signin successful!', session: data.session, userType });
    } catch (err) {
        console.error('Signin error:', err);
        res.status(500).json({ error: 'Internal server error during signin' });
    }
});

/**
 * GET /api/videos
 * Endpoint to fetch videos from Supabase db
 */
app.get('/api/videos', async (req, res) => {
    try {
        const { data, error } = await supabase.from('videos').select('*');
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('Fetch videos error:', err);
        res.status(500).json({ error: 'Internal server error fetching videos' });
    }
});

/**
 * GET /api/videos/:id
 * Fetch a single video by ID from Supabase
 */
app.get('/api/videos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
        if (error || !data) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('Fetch single video error:', err);
        res.status(500).json({ error: 'Internal server error fetching video' });
    }
});

// Start server only if run directly (allows testing import)
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

module.exports = app;
