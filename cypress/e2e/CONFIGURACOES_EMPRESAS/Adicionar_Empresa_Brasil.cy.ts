/*
Fluxo de teste:
- Cadastro de usuário novo
- Cadastro de empresa
- Seleção de país e moeda
- Validação de CNPJ
- Configuração inicial do site
*/

type LoginViewport = string | { width: number; height: number };

describe('Adicionar Empresa Brasil', () => {
  const timestamp = Date.now();
  const nomeUsuario = `Usuario ${timestamp}`;
  const emailUsuario = Cypress.env('TEST_USER_EMAIL');
  const senhaUsuario = Cypress.env('TEST_USER_PASSWORD'); 
  
  const razaoSocial = `Barbearia ${timestamp}`;
  const fantasia = `Fantasia ${timestamp}`;
  const slug = `site-${timestamp}`;

  function gerarCnpjValido() {
    const base = `${Math.floor(10000000 + Math.random() * 90000000)}0001`;

    function calcularDigito(cnpjBase: string) {
      const pesos =
        cnpjBase.length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

      const soma = cnpjBase
        .split('')
        .reduce((total, numero, index) => total + Number(numero) * pesos[index], 0);

      const resto = soma % 11;
      return resto < 2 ? '0' : String(11 - resto);
    }

    const digito1 = calcularDigito(base);
    const digito2 = calcularDigito(base + digito1);
    return `${base}${digito1}${digito2}`.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }

  const cnpjValido = gerarCnpjValido();

  function preencherCampoVisivel(selector: 'input' | 'textarea', index: number, valor: string) {
    cy.get(`${selector}:visible`)
      .eq(index)
      .should('be.visible')
      .click({ force: true })
      .type('{selectall}{backspace}', { force: true })
      .type(valor, { force: true, delay: 20 });
  }

  function preencherCampoProximoAoLabel(label: RegExp, valor: string) {
    cy.contains(label).should('exist').then(($label) => {
      const labelRect = $label.get(0)!.getBoundingClientRect();
      cy.get('input:visible, textarea:visible').then(($campos) => {
        const campo = $campos
          .toArray()
          .filter((c) => c.getBoundingClientRect().top >= labelRect.top - 10)
          .sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            return (
              Math.abs(rectA.top - labelRect.bottom) + Math.abs(rectA.left - labelRect.left) -
              (Math.abs(rectB.top - labelRect.bottom) + Math.abs(rectB.left - labelRect.left))
            );
          })[0];
        cy.wrap(campo)
          .click({ force: true })
          .type('{selectall}{backspace}', { force: true })
          .type(valor, { force: true, delay: 20 });
      });
    });
  }

   function selecionarComboPorLabel(label: RegExp, opcao: RegExp) {
  cy.contains(label, { timeout: 30000 })
    .should('exist')
    .then(($label: JQuery<HTMLElement>) => {
      const elementoLabel = $label.get(0);

      if (!elementoLabel) {
        throw new Error(`Label não encontrado: ${label}`);
      }

      const labelRect = elementoLabel.getBoundingClientRect();

      cy.get('.q-field:visible, [role="combobox"]:visible').then(
        ($campos: JQuery<HTMLElement>) => {
          const camposOrdenados = $campos
            .toArray()
            .filter((campo) => {
              const rect = campo.getBoundingClientRect();

              return rect.top >= labelRect.top - 10;
            })
            .sort((a, b) => {
              const rectA = a.getBoundingClientRect();
              const rectB = b.getBoundingClientRect();

              const distanciaA =
                Math.abs(rectA.top - labelRect.bottom) +
                Math.abs(rectA.left - labelRect.left);

              const distanciaB =
                Math.abs(rectB.top - labelRect.bottom) +
                Math.abs(rectB.left - labelRect.left);

              return distanciaA - distanciaB;
            });

          expect(
            camposOrdenados.length,
            `combo encontrado para label ${label}`
          ).to.be.greaterThan(0);

          const combo = camposOrdenados[0];

          if (!combo) {
            throw new Error(`Combo não encontrado para label: ${label}`);
          }

          cy.wrap(combo).click({ force: true });
        }
      );
    });

  cy.wait(700);

  cy.get('body').then(($body) => {
    const opcoes = $body
      .find(
        '.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]:visible'
      )
      .toArray()
      .filter((item) => {
        const texto = Cypress.$(item)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

        return opcao.test(texto);
      }) as HTMLElement[];

    expect(
      opcoes.length,
      `opção encontrada no combo: ${opcao}`
    ).to.be.greaterThan(0);

    const opcaoSelecionada = opcoes[0];

    if (!opcaoSelecionada) {
      throw new Error(`Opção não encontrada no combo: ${opcao}`);
    }

    cy.wrap(opcaoSelecionada).click({ force: true });
  });

  cy.wait(700);
}

  function abrirCadastroUsuario(viewport?: LoginViewport) {
    const email = Cypress.env('TEST_USER_EMAIL');
    const password = Cypress.env('TEST_USER_PASSWORD');
    if (!email || !password) throw new Error('Configure TEST_USER_EMAIL e TEST_USER_PASSWORD');

    if (viewport) {
      typeof viewport === 'string'
        ? cy.viewport(viewport as any)
        : cy.viewport(viewport.width, viewport.height);
    }

    cy.visit('/');
    cy.get('input').first().type(email);
    cy.get('input[type="password"]').first().type(password);
    cy.contains(/entrar|login|acessar/i).click();
    cy.contains('Adicionar empresa').click({ force: true });  
    
  }  

  function preencherInformacoesEmpresa() {
    preencherCampoProximoAoLabel(/Raz[aã]o social/i, razaoSocial);

    preencherCampoProximoAoLabel(/Fantasia/i, fantasia);

    selecionarComboPorLabel(/Pa[ií]s/i, /Brasil/i);

    selecionarComboPorLabel(/Moeda/i, /Real|R\$\s*-?\s*Real|Brasileiro/i);

    cy.get('body').then(($body) => {
      if (/CNPJ/i.test($body.text())) {
        preencherCampoProximoAoLabel(/CNPJ/i, cnpjValido);
      } else {
        Cypress.log({
          name: 'CNPJ',
          message:
            'Campo CNPJ não apareceu nesta etapa. Seguindo para gravar empresa.',
        });
      }
    });

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Configura[çc][aã]o do site|URL do site|Segmento|dados iniciais/i
      );
  }
  

   function preencherConfiguracaoSite() {
    preencherCampoProximoAoLabel(/URL do site|slug/i, slug);

    selecionarComboPorLabel(/Segmento/i, /Barbearia/i);

    cy.contains(/Gravar/i, { timeout: 30000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('body', { timeout: 30000 })
      .invoke('text')
      .should(
        'match',
        /Dashboard|Agenda|Clientes|Configura[çc][õo]es|Bom dia|Boa tarde|Boa noite|sucesso/i
      );
  salvarUsuarioGeradoNoJson()
  }

   function salvarUsuarioGeradoNoJson() {
  const arquivo = 'cypress/fixtures/usuarios-gerados.json';

  const usuarioGerado = {
    dataCriacao: new Date().toISOString(),
    pais: 'Brasil',
    nomeUsuario,
    emailUsuario,
    senhaUsuario,
    razaoSocial,
    fantasia,
    documento: cnpjValido,
    slug,
  };

  cy.readFile(arquivo).then((usuariosExistentes) => {
    const usuarios = Array.isArray(usuariosExistentes)
      ? usuariosExistentes
      : [];

    usuarios.push(usuarioGerado);

    cy.writeFile(arquivo, usuarios);

    cy.log(`Usuário salvo no JSON: ${emailUsuario}`);
  });
}

  it('Cadastra usuário, empresa e site com sucesso', () => {
    abrirCadastroUsuario();    
    preencherInformacoesEmpresa();
    preencherConfiguracaoSite();
  });
});
