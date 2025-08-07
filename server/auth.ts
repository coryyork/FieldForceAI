import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { storage } from "./storage";
import { setupAuth as setupReplitAuth } from "./replitAuth";

// Configure Local Strategy (Email/Password)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!user.passwordHash) {
        return done(null, false, { message: 'Please use social login for this account' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Configure Google Strategy (if environment variables are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'));
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create new user
        const newUser = {
          email,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          googleId: profile.id
        };
        user = await storage.createUser(newUser);
      } else if (!user.googleId) {
        // Link Google account to existing user
        await storage.updateUser(user.id, { googleId: profile.id });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
}

// Configure GitHub Strategy (if environment variables are provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in GitHub profile'));
      }

      let user = await storage.getUserByEmail(email);
      if (!user) {
        // Create new user
        const newUser = {
          email,
          firstName: profile.displayName?.split(' ')[0] || '',
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          githubId: profile.id
        };
        user = await storage.createUser(newUser);
      } else if (!user.githubId) {
        // Link GitHub account to existing user
        await storage.updateUser(user.id, { githubId: profile.id });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
}

export async function setupMultiAuth(app: Express) {
  // Setup Replit authentication first
  await setupReplitAuth(app);

  // Email/Password login
  app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const newUser = {
        email,
        firstName,
        lastName,
        passwordHash
      };

      const user = await storage.createUser(newUser);
      
      // Log them in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  }

  // GitHub OAuth routes
  if (process.env.GITHUB_CLIENT_ID) {
    app.get('/api/auth/github',
      passport.authenticate('github', { scope: ['user:email'] })
    );

    app.get('/api/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/login' }),
      (req, res) => {
        res.redirect('/');
      }
    );
  }

  // Replit OAuth route (redirect to existing Replit auth)
  app.get('/api/auth/replit', (req, res) => {
    res.redirect('/api/login');
  });
}