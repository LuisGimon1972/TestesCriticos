describe('Produtos - Cadastro', () => {
  beforeEach(() => {
  cy.clearCookies();
  cy.clearLocalStorage();
});
  const timestamp = Date.now();
  const nomeProduto = `E2E Produto ${timestamp}`;
  const valor = '2500'; // pode virar 25,00 em campo com máscara
  const quantidade = '10';
  const comissao = '2000';

  beforeEach(() => {
    cy.login();

    cy.get('body').then(($body) => {
      if ($body.text().includes('Entendi')) {
        cy.contains('Entendi').click({ force: true });
      }
    });

    cy.contains(/Produtos/i, { timeout: 30000 })
      .scrollIntoView()
      .click({ force: true });

    cy.contains(/Listagem de produtos/i, { timeout: 30000 })
      .should('be.visible');
  });

  it('Deve cadastrar um produto E2E com nome aleatório.', () => {

  cy.contains(/Cadastrar produto/i)
    .should('be.visible')
    .click({ force: true });

  cy.url().should('match', /\/products\/(create|cadastro)/);

  // 🔥 helper inline (evita repetição)
  function preencherInput(index: number, valor: string) {
    cy.get('input:visible')
      .eq(index)
      .should('be.visible')
      .click({ force: true });

    cy.get('input:visible')
      .eq(index)
      .type(valor, { force: true });
  }

  preencherInput(0, nomeProduto);
  preencherInput(1, valor);
  preencherInput(2, quantidade);
  preencherInput(3, comissao);

  cy.contains(/Gravar/i)
    .should('be.visible')
    .click({ force: true });

  cy.get('body')
    .should('contain.text', 'produto');
});
});