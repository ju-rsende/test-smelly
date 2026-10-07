const { UserService } = require('../src/userService');

// Fábrica de dados de teste: os valores relevantes ficam visíveis em cada teste
// e apenas o que importa para o cenário é sobrescrito.
const criarDadosUsuario = (sobrescritas = {}) => ({
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
  isAdmin: false,
  ...sobrescritas,
});

const criarUsuario = (service, sobrescritas = {}) => {
  const { nome, email, idade, isAdmin } = criarDadosUsuario(sobrescritas);
  return service.createUser(nome, email, idade, isAdmin);
};

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário criado com id gerado e status "ativo"', () => {
      // Arrange
      const dados = criarDadosUsuario();

      // Act
      const usuario = userService.createUser(dados.nome, dados.email, dados.idade);

      // Assert
      expect(usuario).toMatchObject({
        nome: dados.nome,
        email: dados.email,
        idade: dados.idade,
        isAdmin: false,
        status: 'ativo',
      });
      expect(usuario.id).toEqual(expect.any(String));
    });

    test('gera ids diferentes para usuários diferentes', () => {
      // Arrange
      const primeiro = criarUsuario(userService, { email: 'a@teste.com' });

      // Act
      const segundo = criarUsuario(userService, { email: 'b@teste.com' });

      // Assert
      expect(segundo.id).not.toBe(primeiro.id);
    });

    test('lança erro quando o usuário é menor de idade', () => {
      // Arrange
      const dados = criarDadosUsuario({ idade: 17 });

      // Act
      const criarMenor = () => userService.createUser(dados.nome, dados.email, dados.idade);

      // Assert
      expect(criarMenor).toThrow('O usuário deve ser maior de idade.');
    });

    test('aceita usuário com exatamente 18 anos', () => {
      // Arrange
      const dados = criarDadosUsuario({ idade: 18 });

      // Act
      const usuario = userService.createUser(dados.nome, dados.email, dados.idade);

      // Assert
      expect(usuario.idade).toBe(18);
    });

    test('lança erro quando um campo obrigatório não é informado', () => {
      // Arrange
      const dados = criarDadosUsuario();

      // Act
      const criarSemEmail = () => userService.createUser(dados.nome, undefined, dados.idade);

      // Assert
      expect(criarSemEmail).toThrow('Nome, email e idade são obrigatórios.');
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário previamente criado', () => {
      // Arrange
      const usuarioCriado = criarUsuario(userService, { nome: 'Alice' });

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('retorna null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.getUserById(idInexistente);

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('desativa um usuário comum e retorna true', () => {
      // Arrange
      const usuarioComum = criarUsuario(userService, { isAdmin: false });

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
      expect(userService.getUserById(usuarioComum.id).status).toBe('inativo');
    });

    test('não desativa um administrador e retorna false', () => {
      // Arrange
      const usuarioAdmin = criarUsuario(userService, { isAdmin: true });

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
      expect(userService.getUserById(usuarioAdmin.id).status).toBe('ativo');
    });

    test('retorna false quando o usuário não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('inclui id, nome e status de cada usuário cadastrado', () => {
      // Arrange
      const alice = criarUsuario(userService, { nome: 'Alice', email: 'alice@email.com' });
      const bob = criarUsuario(userService, { nome: 'Bob', email: 'bob@email.com' });
      userService.deactivateUser(bob.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(new RegExp(`${alice.id}.*Alice.*\\bativo\\b`));
      expect(relatorio).toMatch(new RegExp(`${bob.id}.*Bob.*\\binativo\\b`));
    });

    test('informa que não há usuários quando a base está vazia', () => {
      // Arrange: a base já está vazia (beforeEach)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Nenhum usuário cadastrado.');
    });
  });
});
