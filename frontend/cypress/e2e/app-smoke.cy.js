describe('Mood Tracker smoke test', () => {
  it('loads the auth screen', () => {
    cy.visit('/');
    cy.contains('Welcome Back').should('be.visible');
    cy.contains('Sign In').should('be.visible');
    cy.contains('Need an account? Register').should('be.visible');
  });
});
