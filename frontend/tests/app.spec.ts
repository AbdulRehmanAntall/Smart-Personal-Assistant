import { test, expect } from '@playwright/test';

test.describe('Smart Personal Assistant E2E Tests', () => {
  test('Landing page loads correctly and has expected title', async ({ page }) => {
    await page.goto('/');

    // Check if the logo/title exists
    const title = page.locator('h1', { hasText: 'AllignAI' });
    await expect(title).toBeVisible();

    // Check if the hero section text exists
    const heroText = page.locator('h1', { hasText: 'Your Intelligent' });
    await expect(heroText).toBeVisible();

    // Check if the "Login" button is present
    const loginButton = page.locator('a', { hasText: 'Login' }).first();
    await expect(loginButton).toHaveAttribute('href', '/login');
  });

  test('Navigation to Login page works', async ({ page }) => {
    await page.goto('/');

    // Click the Login link in the header
    const loginButton = page.locator('a', { hasText: 'Login' }).first();
    await loginButton.click();

    // Verify the URL changes to /login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Navigation to Sign Up page works', async ({ page }) => {
    await page.goto('/');

    // Click the Sign Up link in the header
    const signUpButton = page.locator('a', { hasText: 'Sign Up' }).first();
    await signUpButton.click();

    // Verify the URL changes to /signup
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test('Features section is visible', async ({ page }) => {
    await page.goto('/');

    // Check if the features section is visible by finding specific feature titles
    await expect(page.locator('h3', { hasText: 'Smart Scheduling' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Task Management' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Job Finder' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Email Automation' })).toBeVisible();
  });
});

test.describe('Login Page Tests', () => {
  test('Renders login form fields correctly', async ({ page }) => {
    await page.goto('/login');

    // Check if input fields are present
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();

    // Check if the Remember Me checkbox is present
    await expect(page.locator('button[role="checkbox"]')).toBeVisible(); // Shadcn UI checkbox usually uses button role

    // Check if the submit button is present
    await expect(page.locator('button[type="submit"]', { hasText: 'Login' })).toBeVisible();

    // Check if Continue with Google button is present
    await expect(page.locator('button', { hasText: 'Continue with Google' })).toBeVisible();
  });

  test('Continue with Google button redirects to Google Auth', async ({ page }) => {
    // Intercept the API call to return a fake auth URL
    await page.route('**/api/auth/google/connect', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ auth_url: 'https://accounts.google.com/o/oauth2/v2/auth?mock=true' })
      });
    });

    await page.goto('/login');

    // Click Continue with Google
    await page.click('button:has-text("Continue with Google")');

    // Verify the page redirects to the mock Google Auth URL
    await expect(page).toHaveURL(/.*accounts\.google\.com.*/);
  });

  test('Navigation to Sign Up from Login works', async ({ page }) => {
    await page.goto('/login');

    // Click "Sign Up" link at the bottom
    const signUpLink = page.locator('a', { hasText: 'Sign Up' });
    await signUpLink.click();

    // Verify the URL changes to /signup
    await expect(page).toHaveURL(/.*\/signup/);
  });
});

test.describe('Sign Up Page Tests', () => {
  test('Renders sign up form fields correctly', async ({ page }) => {
    await page.goto('/signup');

    // Check if input fields are present
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();

    // Check if the submit button is present
    await expect(page.locator('button[type="submit"]', { hasText: 'Sign Up' })).toBeVisible();

    // Check if Continue with Google button is present
    await expect(page.locator('button', { hasText: 'Continue with Google' })).toBeVisible();
  });

  test('Shows error when passwords do not match', async ({ page }) => {
    await page.goto('/signup');

    // Fill out the form with mismatched passwords
    await page.fill('input#username', 'testuser');
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', 'password123');
    await page.fill('input#confirmPassword', 'password456');

    // Submit the form
    await page.click('button[type="submit"]');

    // Expect an error message stating passwords do not match
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('Navigation to Login from Sign Up works', async ({ page }) => {
    await page.goto('/signup');

    // Click "Login" link at the bottom
    const loginLink = page.locator('a', { hasText: 'Login' });
    await loginLink.click();

    // Verify the URL changes to /login
    await expect(page).toHaveURL(/.*\/login/);
  });
});

test.describe('Authenticated Pages Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock tokens into localStorage to bypass the login screen
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock_token');
      window.localStorage.setItem('auth_user_cache', JSON.stringify({ name: 'Playwright User', email: 'playwright@example.com' }));
    });

    // Mock all API endpoints to return mock data and handle CORS
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      };

      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers });
        return;
      }

      if (request.url().includes('/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ name: 'Playwright User', email: 'playwright@example.com' }),
          headers
        });
        return;
      }

      if (request.url().includes('/integrations/status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ google: { connected: false } }),
          headers
        });
        return;
      }

      // Default mock for all other API endpoints to return an empty object/array
      // Returning {} prevents destructuring errors on endpoints expecting objects
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}', headers });
    });
  });

  test('Dashboard loads correctly with authenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    // Verify it shows the mocked user's name
    await expect(page.locator('h1', { hasText: 'Hi, Playwright User' })).toBeVisible();
    await expect(page.locator('p', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('Smart Email loads correctly', async ({ page }) => {
    await page.goto('/email');
    await expect(page.locator('h1', { hasText: 'Smart Email' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Compose' })).toBeVisible();
  });

  test('Classroom (Tasks & Projects) loads correctly', async ({ page }) => {
    await page.goto('/classroom');
    await expect(page.locator('h1', { hasText: 'Tasks & Projects' })).toBeVisible();
  });

  test('Daily News loads correctly', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('h1', { hasText: 'Daily News' })).toBeVisible();
  });

  test('Job Finder loads correctly', async ({ page }) => {
    await page.goto('/job-finder');
    await expect(page.locator('h1', { hasText: 'Job Finder' })).toBeVisible();
  });

  test('Settings loads correctly', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible();
  });
});
