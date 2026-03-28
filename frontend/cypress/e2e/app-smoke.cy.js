describe('Health Tracker frontend flows', () => {
  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    created_at: '2026-03-01T00:00:00.000Z'
  };

  const bootAuthenticatedApp = (overrides = {}) => {
    let todayEntry = overrides.todayEntry ?? null;
    let recentEntries = overrides.recentEntries ?? [];
    let comparison = overrides.comparison ?? {
      current: { mood: 0, sleep: 0 },
      previous: { mood: 0, sleep: 0 },
      moodChange: 0,
      sleepChange: 0
    };

    cy.intercept('GET', '**/api/auth/me', { statusCode: 200, body: user }).as('authMe');
    cy.intercept('GET', '**/api/mood-entries/user/1/today', (req) => {
      req.reply({ statusCode: 200, body: todayEntry });
    }).as('getToday');
    cy.intercept('GET', '**/api/mood-entries/user/1/recent', (req) => {
      req.reply({ statusCode: 200, body: recentEntries });
    }).as('getRecent');
    cy.intercept('GET', '**/api/mood-entries/user/1/comparison', (req) => {
      req.reply({ statusCode: 200, body: comparison });
    }).as('getComparison');

    cy.intercept('POST', '**/api/mood-entries', (req) => {
      const created = {
        id: 101,
        user_id: 1,
        date: new Date().toISOString().split('T')[0],
        mood: req.body.mood,
        feelings: req.body.feelings,
        reflection: req.body.reflection,
        sleep: req.body.sleep
      };

      todayEntry = created;
      recentEntries = [created, ...recentEntries].slice(0, 11);
      req.reply({ statusCode: 201, body: created });
    }).as('createMood');

    cy.intercept('PUT', '**/api/mood-entries/*', (req) => {
      const updated = {
        ...(todayEntry || {}),
        id: Number(req.url.split('/').pop()),
        mood: req.body.mood,
        feelings: req.body.feelings,
        reflection: req.body.reflection,
        sleep: req.body.sleep
      };

      todayEntry = updated;
      recentEntries = recentEntries.map((entry) => (entry.id === updated.id ? { ...entry, ...updated } : entry));
      req.reply({ statusCode: 200, body: updated });
    }).as('updateMood');

    cy.intercept('PUT', '**/api/users/1', (req) => {
      const updatedUser = { ...user, ...req.body };
      req.reply({ statusCode: 200, body: updatedUser });
    }).as('updateUser');

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('mood_tracker_token', 'test-token');
        win.localStorage.setItem('mood_theme', 'light');
      }
    });

    cy.wait('@authMe');
    cy.wait('@getToday');
    cy.wait('@getRecent');
    cy.wait('@getComparison');
  };

  it('loads the auth screen', () => {
    cy.visit('/');
    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Sign In').should('be.visible');
    cy.contains('Need an account? Register').should('be.visible');
  });

    it('adds a mood entry from Log Check-In', () => {
    bootAuthenticatedApp();

      cy.contains('button', 'Log Check-In').click();
      cy.get('h2').contains('Log Health Check-In').should('be.visible');

    cy.get('input[type="range"]').invoke('val', '8').trigger('input').trigger('change');
    cy.contains('button', 'Happy').click();
    cy.get('textarea').type('Solid day and feeling productive.');
    cy.get('#sleep-hours').type('7.5');

    cy.contains('button', 'Save Check-In').click();
    cy.wait('@createMood').its('request.body').should((body) => {
      expect(body).to.include({ reflection: 'Solid day and feeling productive.', sleep: 7.5 });
      expect(body.mood).to.be.a('number');
      expect(body.feelings).to.deep.equal(['Happy']);
    });

      cy.contains('h2', 'Today\'s Check-In').should('be.visible');
    cy.contains('.todays-entry', 'Solid day and feeling productive.').should('be.visible');
  });

  it('edits today\'s mood entry from dashboard', () => {
    const seededEntry = {
      id: 55,
      user_id: 1,
      date: '2026-03-26',
      mood: 6,
      feelings: ['Calm'],
      reflection: 'Initial reflection',
      sleep: 6.5
    };

    bootAuthenticatedApp({
      todayEntry: seededEntry,
      recentEntries: [seededEntry]
    });

    cy.contains('button', 'Edit Entry').click();
    cy.get('h2').contains('Edit Health Check-In').should('be.visible');

    cy.get('input[type="range"]').invoke('val', '9').trigger('input').trigger('change');
    cy.contains('button', 'Hopeful').click();
    cy.get('textarea').clear().type('Updated reflection after a better afternoon.');
    cy.get('#sleep-hours').clear().type('8');

    cy.contains('button', 'Update Check-In').click();
    cy.wait('@updateMood').its('request.body').should((body) => {
      expect(body).to.include({ reflection: 'Updated reflection after a better afternoon.', sleep: 8 });
      expect(body.mood).to.be.a('number');
      expect(body.feelings).to.include('Hopeful');
    });

      cy.contains('h2', 'Today\'s Check-In').should('be.visible');
    cy.contains('.todays-entry', 'Updated reflection after a better afternoon.').should('be.visible');
  });

  it('updates theme between light and dark from settings', () => {
    bootAuthenticatedApp();

    cy.contains('button', 'Test User').click();
    cy.contains('h2', 'Profile Settings').should('be.visible');

    cy.get('html').should('have.attr', 'data-theme', 'light');
    cy.contains('button', 'Dark').click();
    cy.get('html').should('have.attr', 'data-theme', 'dark');
    cy.contains('button', 'Light').click();
    cy.get('html').should('have.attr', 'data-theme', 'light');

    cy.contains('button', 'Save Changes').click();
    cy.wait('@updateUser');
    cy.contains('Profile updated successfully').should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('mood_theme')).to.equal('light');
    });
  });
});
