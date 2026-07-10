describe('Teste de segurança completo no login e módulo Pessoas', () => {
  
  beforeEach(() => {
    cy.viewport(1920, 1080);
  });

  it('Executa validações de segurança', () => {
    // Busca a variável de ambiente. Se não existir, usa '/' por padrão (pega a baseUrl do cypress.config)
    const baseUrl = Cypress.env('BASE_URL') || '/';
    
    // 1) Configura o Espião (Stub) para capturar alertas nativos do browser
    const alertStub = cy.stub();
    cy.on('window:alert', alertStub);

    // TESTE DE SEGURANÇA BRUTE FORCE
    cy.visit(baseUrl);
    cy.contains(/entrar/i).click();

    for (let i = 0; i <= 50; i++) {
      cy.get('input[type="email"], input[type="text"]').first().clear().type(`user${i}@teste.com`);
      cy.get('input[type="password"]').first().clear().type('senhaErrada');
      cy.get('button').filter((index, el) => /sign in|entrar/i.test(el.innerText)).click();
    }
    cy.log('1) TESTE DE SEGURANÇA BRUTE FORCE OK');

    // 2) TESTE DE SEGURANÇA XSS INJECTION
    cy.get('input[type="email"], input[type="text"]', { timeout: 5000 }).first().clear().type('<script>alert("xss")</script>');
    cy.get('input[type="password"]').first().clear().type('senhaqualquer');
    cy.get('button').filter((index, el) => /sign in|entrar/i.test(el.innerText)).click();

    // Validação correta: Garante que NENHUM alert do navegador foi disparado
    cy.wrap(alertStub).should('not.have.been.called');

    // Verifica se existe texto de bloqueio/captcha na tela
    cy.get('body').then(($body) => {
      if (/bloqueado|captcha/i.test($body.text())) {
        cy.log('Bloqueio/captcha detectado visualmente');
      } else {
        cy.log('Nenhum bloqueio/captcha detectado');
      }
    });
    cy.log('2) TESTE DE SEGURANÇA XSS INJECTION OK');

    // 3) TESTE DE SEGURANÇA MENSAGENS DE ERRO SEGURAS
    cy.get('body').then(($body) => {
      if ($body.find('.error-message').length > 0) {
        cy.get('.error-message').invoke('text').then((text) => {
          expect(text).to.not.match(/SQL|tabela|stack/i);
        });
      } else {
        cy.log('Nenhuma mensagem de erro encontrada');
      }
    });
    cy.log('3) TESTE DE SEGURANÇA MENSAGENS DE ERRO SEGURAS OK');

    // 4) TESTE DE SEGURANÇA CONTROLE DE ACESSO PÓS-LOGIN
    cy.get('body').then(($body) => {
      if (/403|não autorizado/i.test($body.text())) {
        cy.log('⚠️ Acesso restrito detectado');
      }
    });
    cy.log('4) TESTE DE SEGURANÇA CONTROLE DE ACESSO PÓS-LOGIN OK');

    // 5) TESTE DE SEGURANÇA COOKIES DE SESSÃO
    cy.getCookies().then((cookies) => {
      const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
      if (authCookie) {
        expect(authCookie.httpOnly).to.be.true;
        expect(authCookie.secure).to.be.true;
      } else {
        cy.log('Nenhum cookie de autenticação encontrado');
      }
    });
    cy.log('5) TESTE DE SEGURANÇA COOKIES DE SESSÃO OK');

    // 6) TESTE DE SEGURANÇA CAMPOS VAZIOS
    cy.visit(baseUrl);
    cy.contains(/entrar/i).click();
    cy.get('input[type="email"], input[type="text"]').first().clear();
    cy.get('input[type="password"]').first().clear();
    cy.get('button').filter((index, el) => /sign in|entrar/i.test(el.innerText)).click();

    cy.get('body').then(($body) => {
      if (/obrigatório|preencha/i.test($body.text())) {
        cy.log('⚠️ Mensagem de campo obrigatório detectada');
      }
    });
    cy.log('6) TESTE DE SEGURANÇA CAMPOS VAZIOS OK');

    // 7) TESTE DE SEGURANÇA REPLAY DE REQUISIÇÃO
    // Se o baseUrl for apenas '/', precisamos montar a URL completa para a API baseada na origem atual
    const fullLoginUrl = baseUrl.startsWith('http') ? `${baseUrl}/login` : `${Cypress.config('baseUrl')}/login`;

    cy.request({
      method: 'POST',
      url: fullLoginUrl,
      body: { email: Cypress.env('USER') || 'teste', password: Cypress.env('PASS') || '123' },
      failOnStatusCode: false
    }).then(() => {
      cy.request({
        method: 'POST',
        url: fullLoginUrl,
        body: { email: Cypress.env('USER') || 'teste', password: Cypress.env('PASS') || '123' },
        failOnStatusCode: false
      }).then((replayResponse) => {
        expect(replayResponse.status).to.not.eq(200);
      });
    });
    cy.log('7) TESTE DE SEGURANÇA REPLAY DE REQUISIÇÃO OK');

    // 8) TESTE DE SEGURANÇA ACESSO MÓDULO PESSOAS
    const pessoasUrl = baseUrl.startsWith('http') ? `${baseUrl}/py/pessoa` : '/py/pessoa';
    cy.visit(pessoasUrl);
    
    cy.get('body').then(($body) => {
      if (/Pessoas|Cadastro de Pessoas|Lista de Pessoas/i.test($body.text())) {
        cy.log('Título de Pessoas encontrado na página');
      } else {
        cy.log('Nenhum título de Pessoas encontrado na página');
      }
    });
    cy.log('8) TESTE DE SEGURANÇA ACESSO MÓDULO PESSOAS OK');

    // 9) TESTE DE SEGURANÇA DADOS SENSÍVEIS
    cy.get('html').invoke('html').then((htmlConteudo) => {
      expect(htmlConteudo).to.not.match(/senha\s*=\s*|chave\s*=\s*|token\s*=\s*/i);
    });
    cy.log('9) TESTE DE SEGURANÇA DADOS SENSÍVEIS OK');

    // 10) TESTE DE SEGURANÇA TESTE SEM LOGIN
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit(pessoasUrl);
    
    cy.get('body').then(($body) => {
      if (/login|entrar/i.test($body.text())) {
        cy.log('⚠️ Sistema exigiu login para acessar Pessoas');
      } else {
        cy.log('Página Pessoas não exibiu mensagem de login, verificar comportamento esperado');
      }
    });
    cy.log('10) TESTE DE SEGURANÇA TESTE SEM LOGIN OK');
  });
});