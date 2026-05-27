describe('Smoke Test - SG Agenda', () => {
  beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
  it('Deve carregar o sistema de homologação.', () => {
    cy.visit('/');
    cy.title().should('match', /SG Agenda|Painel/i);
  });
  it('Finalizado', () => {
    cy.log('Teste Finalizado');
  });   
});