-- DarkMoon Store - banco EXCLUSIVO de testes: loja_gotica_test
-- IMPORTANTE: execute este arquivo SOMENTE no schema loja_gotica_test.
-- Ele recria as tabelas deste banco de testes. Nao execute em loja_gotica.
-- Exemplo no PowerShell:
-- & 'C:\Program Files\MySQL\MySQL Server 26.10\bin\mysql.exe' -u darkmoon -p loja_gotica_test < .\loja_gotica_test_corrigido.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Limpa objetos antigos que nao sao utilizados pelo backend atual.
DROP VIEW IF EXISTS vw_produtos_completo;
DROP PROCEDURE IF EXISTS sp_listar_produtos;
DROP FUNCTION IF EXISTS fn_preco_com_desconto;
DROP TRIGGER IF EXISTS trg_produtos_valores_positivos;

-- Recria somente as tabelas do banco de testes.
DROP TABLE IF EXISTS itens_pedido;
DROP TABLE IF EXISTS produto_categoria;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS cupons;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) DEFAULT NULL,
  senha VARCHAR(255) NOT NULL,
  papel ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  data_cadastro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
  id_categoria INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produtos (
  id_produto INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT DEFAULT NULL,
  preco DECIMAL(10,2) NOT NULL,
  estoque INT NOT NULL,
  imagem VARCHAR(255) DEFAULT NULL,
  genero ENUM('Masculino', 'Feminino', 'Unissex') NOT NULL,
  PRIMARY KEY (id_produto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cupons (
  id_cupom INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(50) NOT NULL,
  percentual_desconto DECIMAL(5,2) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_cupom),
  UNIQUE KEY uq_cupons_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pedidos (
  id_pedido INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  data_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pendente','Pago','Enviado','Entregue','Cancelado') DEFAULT 'Pendente',
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_pedido),
  KEY idx_pedidos_usuario (id_usuario),
  CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE produto_categoria (
  id_produto INT NOT NULL,
  id_categoria INT NOT NULL,
  PRIMARY KEY (id_produto, id_categoria),
  KEY idx_produto_categoria_categoria (id_categoria),
  CONSTRAINT fk_produto_categoria_produto FOREIGN KEY (id_produto)
    REFERENCES produtos (id_produto) ON DELETE CASCADE,
  CONSTRAINT fk_produto_categoria_categoria FOREIGN KEY (id_categoria)
    REFERENCES categorias (id_categoria) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_pedido (
  id_pedido INT NOT NULL,
  id_produto INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_pedido, id_produto),
  KEY idx_itens_pedido_produto (id_produto),
  CONSTRAINT fk_itens_pedido_pedido FOREIGN KEY (id_pedido)
    REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_itens_pedido_produto FOREIGN KEY (id_produto)
    REFERENCES produtos (id_produto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios ficticios de teste. Senhas geradas com o formato do SenhaHasher do projeto.
-- Cliente: cliente.ficticio@example.com / Cliente#Lua2026
-- Admin:   admin@teste.com / Admin#Lua2026
INSERT INTO usuarios
  (id_usuario, nome, email, cpf, senha, papel, data_cadastro)
VALUES
  (1, 'Cliente Ficticio', 'cliente.ficticio@example.com', NULL,
   'scrypt$a6v5htJDk9bSTiP8o7E4+A==$5SIcPtdo3d5G6PiijfZsLCvz6+43DGbnZaib7sW4LPJxN24EV5MlaMD/oow+BgqPNRweYRjmAlpye7xZdmY5Qw==',
   'usuario', '2026-08-22 01:51:12'),
  (2, 'Admin Teste', 'admin@teste.com', '111.444.777-35',
   'scrypt$dsRrMnMglSvkIUICsZ25Iw==$rqqEvdWv4LDQweAIhBYpSX5ouaWWGJkRu+XfT4R+18acHZptVBa+Pf82WSydcQEB05Zw/vtexMNnP8vOjP2etQ==',
   'admin', '2026-08-22 01:51:12');

INSERT INTO categorias (id_categoria, nome) VALUES
  (1, 'Camisas'),
  (2, 'Vestidos'),
  (3, 'Botas'),
  (4, 'Acessórios');

INSERT INTO cupons (id_cupom, codigo, percentual_desconto, ativo, data_criacao) VALUES
  (1, 'DARK10', 10.00, 1, '2026-08-23 13:56:05'),
  (2, 'MOON15', 15.00, 1, '2026-08-23 13:56:05'),
  (3, 'GOTICA20', 20.00, 1, '2026-08-23 13:56:05'),
  (4, 'BLACKFRIDAY', 30.00, 1, '2026-08-23 13:56:05'),
  (5, 'TREVOSO', 50.00, 1, '2026-08-23 13:56:55');

INSERT INTO produtos
  (id_produto, nome, descricao, preco, estoque, imagem, genero)
VALUES
  (1, 'Camisa Raven Wings', 'Camisa feminina preta com estampa de cruz alada gótica em prata', 89.90, 11, 'camisa-feminina1.webp', 'Feminino'),
  (2, 'Camisa Kitty Thorn', 'Camisa oversized preta com Hello Kitty cercada por espinhos e design dark', 94.90, 12, 'camisa-feminina2.webp', 'Feminino'),
  (3, 'Camisa Tracker Angel', 'Camisa preta com estampa "TRACKER" guitarra e anjo com estrelas', 89.90, 10, 'camisa-feminina3.webp', 'Feminino'),
  (4, 'Camisa Attitude Flame', 'Camisa branca oversized com manga preta e logo "ATTITUDE" em estilo flamejante', 79.90, 18, 'camisa-feminina4.webp', 'Feminino'),
  (5, 'Camisa Thorn Cross', 'Camisa preta justa com grande estampa de cruz espinhenta prateada', 85.90, 14, 'camisa-feminina5.webp', 'Feminino'),
  (6, 'Camisa Raven Skeleton', 'Camisa masculina preta com estampa de corvo esquelético vermelho sangrento', 99.90, 12, 'camisa-masculina1.webp', 'Masculino'),
  (7, 'Camisa Ghost Distressed', 'Camisa masculina preta destroyed com estampa "GHOST" em tie-dye vermelho e preto', 109.90, 7, 'camisa-masculina2.webp', 'Masculino'),
  (8, 'Camisa Dark Layered', 'Camisa masculina preta com manga longa cinza e estampa gráfica gótica', 95.90, 10, 'camisa-masculina3.webp', 'Masculino'),
  (9, 'Camisa Angel Throne', 'Blusão cinza com estampa detalhada de anjo no trono e mangas com lettering', 119.90, 9, 'camisa-masculina4.webp', 'Masculino'),
  (10, 'Camisa Dark Anime', 'Camisa masculina preta washed com ilustração dark anime de figura mística', 89.90, 14, 'camisa-masculina5.webp', 'Masculino'),
  (11, 'Bota Feminina Midnight Bow', 'Bota feminina preta peluciada com laços', 199.90, 9, 'bota-feminina1.webp', 'Feminino'),
  (13, 'Bota Feminina Dark Heel', 'Bota feminina preta com salto alto e detalhes dourados', 229.90, 10, 'bota-feminina3.webp', 'Feminino'),
  (14, 'Bota Feminina Pink Star', 'Bota feminina rosa com plataforma e correntes de estrela', 239.90, 10, 'bota-feminina4.webp', 'Feminino'),
  (15, 'Bota Feminina Heart Punk', 'Bota feminina preta de cano alto com fivelas de coração', 259.90, 10, 'bota-feminina5.webp', 'Feminino'),
  (16, 'Bota Masculina Skull Strap', 'Bota masculina preta de cano alto com fivelas de caveira', 279.90, 10, 'bota-masculina1.webp', 'Masculino'),
  (17, 'Bota Masculina Dark Rider', 'Bota masculina preta e vinho com cadarço e fivela', 269.90, 10, 'bota-masculina2.webp', 'Masculino'),
  (18, 'Bota Masculina Chain Combat', 'Bota masculina preta com correntes e solado tratorado', 249.90, 10, 'bota-masculina3.webp', 'Masculino'),
  (19, 'Bota Masculina Buckle Combat', 'Bota masculina preta com múltiplas fivelas', 249.90, 10, 'bota-masculina4.webp', 'Masculino'),
  (20, 'Bota Masculina Glossy Night', 'Bota masculina preta envernizada com cadarço', 259.90, 10, 'bota-masculina5.webp', 'Masculino'),
  (21, 'Vestido Velvet Lace', 'Vestido curto preto de veludo com mangas longas de renda e decote quadrado', 159.90, 10, 'vestido1.webp', 'Feminino'),
  (22, 'Vestido Off-Shoulder Gothic', 'Vestido preto tomara-que-caia de renda com saia assimétrica e luvas longas', 169.90, 8, 'vestido2.webp', 'Feminino'),
  (23, 'Vestido White Siren', 'Vestido branco em renda com mangas flare, corset e saia irregular assimétrica', 149.90, 12, 'vestido3.webp', 'Feminino'),
  (24, 'Vestido Corset Noir', 'Vestido preto curto em corset com laço, renda e detalhes de liga', 179.90, 9, 'vestido4.webp', 'Feminino'),
  (25, 'Vestido Crimson Velvet', 'Vestido vermelho em veludo com corset, camadas de renda preta e saia assimétrica', 189.90, 7, 'vestido5.webp', 'Feminino'),
  (26, 'Colar Rosário Raven Cross', 'Colar longo estilo rosário gótico com cruz ornamentada e pingente de coração', 79.90, 14, 'acessorio1.webp', 'Unissex'),
  (27, 'Colar Teia de Aranha', 'Colar statement em prata com design de teia de aranha e pingente de caveira', 89.90, 12, 'acessorio2.webp', 'Unissex'),
  (28, 'Choker Spiked Punk', 'Choker preto de couro com spikes prateados grandes', 59.90, 18, 'acessorio3.webp', 'Unissex'),
  (29, 'Colar Layered Cross', 'Colar duplo em prata com cruz gótica detalhada e contas pretas', 69.90, 18, 'acessorio4.webp', 'Unissex'),
  (30, 'Colar Rosário Blue Stone', 'Colar rosário gótico com pedra azul central, contas pretas e cruz ornamental', 85.90, 14, 'acessorio5.webp', 'Unissex'),
  (31, 'Pulseira Spikes Classic', 'Pulseira de couro preta com spikes prateados', 49.90, 25, 'acessorio6.webp', 'Unissex'),
  (32, 'Pulseira Skull Chain', 'Pulseira larga preta com spikes, caveiras, estrelas e correntes penduradas', 94.90, 10, 'acessorio7.webp', 'Unissex'),
  (33, 'Pulseira Pyramid Studs', 'Pulseira de couro preta com pirâmides prateadas e rebites', 64.90, 16, 'acessorio8.webp', 'Unissex'),
  (34, 'Bota Feminina Crimson Chain', 'Bota feminina preta e vermelha com correntes', 219.90, 10, 'bota-feminina2.webp', 'Feminino');

INSERT INTO produto_categoria (id_produto, id_categoria) VALUES
  (1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
  (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
  (11, 3), (13, 3), (14, 3), (15, 3), (16, 3),
  (17, 3), (18, 3), (19, 3), (20, 3),
  (21, 2), (22, 2), (23, 2), (24, 2), (25, 2),
  (26, 4), (27, 4), (28, 4), (29, 4), (30, 4),
  (31, 4), (32, 4), (33, 4), (34, 3);

INSERT INTO pedidos (id_pedido, id_usuario, data_pedido, status, total) VALUES
  (1, 1, '2026-08-22 01:51:12', 'Entregue', 289.60),
  (2, 1, '2026-08-22 01:51:12', 'Pago', 199.90),
  (3, 1, '2026-08-22 01:51:12', 'Enviado', 199.80),
  (4, 1, '2026-08-22 01:51:25', 'Pago', 89.90),
  (5, 1, '2026-08-22 01:51:25', 'Pago', 89.90);

INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, preco_unitario) VALUES
  (1, 1, 1, 89.90),
  (1, 26, 1, 79.90),
  (1, 28, 2, 59.90),
  (2, 11, 1, 199.90),
  (3, 7, 1, 109.90),
  (3, 10, 1, 89.90),
  (4, 1, 1, 89.90),
  (5, 1, 1, 89.90);

-- Mantem os proximos IDs acima dos registros inseridos.
ALTER TABLE usuarios AUTO_INCREMENT = 3;
ALTER TABLE categorias AUTO_INCREMENT = 5;
ALTER TABLE cupons AUTO_INCREMENT = 6;
ALTER TABLE produtos AUTO_INCREMENT = 35;
ALTER TABLE pedidos AUTO_INCREMENT = 6;

SET FOREIGN_KEY_CHECKS = 1;
