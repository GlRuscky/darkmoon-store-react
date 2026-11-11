
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_listar_produtos` (IN `p_categoria` VARCHAR(100), IN `p_preco_min` DECIMAL(10,2), IN `p_preco_max` DECIMAL(10,2), IN `p_pagina` INT, IN `p_por_pagina` INT)   BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_pagina - 1) * p_por_pagina;

    SELECT
        p.id_produto AS produto_id,
        p.nome       AS produto,
        p.preco,
        p.estoque,
        p.genero,
        c.nome AS categoria,
        COALESCE(SUM(ip.quantidade), 0) AS quantidade_vendida
    FROM produtos p
    LEFT JOIN produto_categoria pc ON pc.id_produto = p.id_produto
    LEFT JOIN categorias c        ON c.id_categoria = pc.id_categoria
    LEFT JOIN itens_pedido ip     ON ip.id_produto = p.id_produto
    WHERE (p_categoria IS NULL OR c.nome = p_categoria)
      AND (p_preco_min IS NULL OR p.preco >= p_preco_min)
      AND (p_preco_max IS NULL OR p.preco <= p_preco_max)
    GROUP BY p.id_produto, p.nome, p.preco, p.estoque, p.genero, c.nome
    ORDER BY c.nome ASC, p.nome ASC
    LIMIT p_por_pagina OFFSET v_offset;
END$$

--
-- Funções
--
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_preco_com_desconto` (`preco_original` DECIMAL(10,2), `percentual_desconto` DECIMAL(5,2)) RETURNS DECIMAL(10,2) DETERMINISTIC BEGIN
    DECLARE preco_final DECIMAL(10,2);
    SET preco_final = preco_original - (preco_original * (percentual_desconto / 100));
    RETURN preco_final;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nome`) VALUES
(1, 'Camisas'),
(2, 'Vestidos'),
(3, 'Botas'),
(4, 'Acessórios');

-- --------------------------------------------------------

--
-- Estrutura para tabela `cupons`
--

CREATE TABLE `cupons` (
  `id_cupom` int(11) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `percentual_desconto` decimal(5,2) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `cupons`
--

INSERT INTO `cupons` (`id_cupom`, `codigo`, `percentual_desconto`, `ativo`, `data_criacao`) VALUES
(1, 'DARK10', 10.00, 1, '2026-08-23 13:56:05'),
(2, 'MOON15', 15.00, 1, '2026-08-23 13:56:05'),
(3, 'GOTICA20', 20.00, 1, '2026-08-23 13:56:05'),
(4, 'BLACKFRIDAY', 30.00, 1, '2026-08-23 13:56:05'),
(5, 'TREVOSO', 50.00, 1, '2026-08-23 13:56:55');

-- --------------------------------------------------------

--
-- Estrutura para tabela `itens_pedido`
--

CREATE TABLE `itens_pedido` (
  `id_pedido` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `preco_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `itens_pedido`
--

INSERT INTO `itens_pedido` (`id_pedido`, `id_produto`, `quantidade`, `preco_unitario`) VALUES
(1, 1, 1, 89.90),
(1, 26, 1, 79.90),
(1, 28, 2, 59.90),
(2, 11, 1, 199.90),
(3, 7, 1, 109.90),
(3, 10, 1, 89.90),
(4, 1, 1, 89.90),
(5, 1, 1, 89.90);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Pendente','Pago','Enviado','Entregue','Cancelado') DEFAULT 'Pendente',
  `total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pedidos`
--

INSERT INTO `pedidos` (`id_pedido`, `id_usuario`, `data_pedido`, `status`, `total`) VALUES
(1, 1, '2026-08-22 01:51:12', 'Entregue', 284.70),
(2, 1, '2026-08-22 01:51:12', 'Pago', 199.90),
(3, 1, '2026-08-22 01:51:12', 'Enviado', 159.80),
(4, 1, '2026-08-22 01:51:25', 'Pago', 89.90),
(5, 1, '2026-08-22 01:51:25', 'Pago', 89.90);

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id_produto` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `descricao` text DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL,
  `estoque` int(11) NOT NULL,
  `imagem` varchar(255) DEFAULT NULL,
  `genero` enum('Masculino','Feminino','Unissex') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id_produto`, `nome`, `descricao`, `preco`, `estoque`, `imagem`, `genero`) VALUES
(1, 'Camisa Raven Wings', 'Camisa feminina preta com estampa de cruz alada gótica em prata', 89.90, 11, 'camisa-feminina1.webp', 'Feminino'),
(2, 'Camisa Kitty Thorn', 'Camisa oversized preta com Hello Kitty cercada por espinhos e design dark', 94.90, 12, 'camisa-feminina2.webp', 'Feminino'),
(3, 'Camisa Tracker Angel', 'Camisa preta com estampa \"TRACKER\" guitarra e anjo com estrelas', 89.90, 10, 'camisa-feminina3.webp', 'Feminino'),
(4, 'Camisa Attitude Flame', 'Camisa branca oversized com manga preta e logo \"ATTITUDE\" em estilo flamejante', 79.90, 18, 'camisa-feminina4.webp', 'Feminino'),
(5, 'Camisa Thorn Cross', 'Camisa preta justa com grande estampa de cruz espinhenta prateada', 85.90, 14, 'camisa-feminina5.webp', 'Feminino'),
(6, 'Camisa Raven Skeleton', 'Camisa masculina preta com estampa de corvo esquelético vermelho sangrento', 99.90, 12, 'camisa-masculina1.webp', 'Masculino'),
(7, 'Camisa Ghost Distressed', 'Camisa masculina preta destroyed com estampa \"GHOST\" em tie-dye vermelho e preto', 109.90, 7, 'camisa-masculina2.webp', 'Masculino'),
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
(34, 'Bota Feminina Crimson Chain', 'Bota feminina preta e vermelha com correntes', 219.90, 10, 'bota-feminina2.webp', 'Feminino'),
(35, 'Bota Feminina Crimson Chain', 'Bota feminina preta e vermelha com correntes', 219.90, 10, 'bota-feminina2.webp', 'Unissex');

--
-- Acionadores `produtos`
--
DELIMITER $$
CREATE TRIGGER `trg_produtos_valores_positivos` BEFORE UPDATE ON `produtos` FOR EACH ROW BEGIN
    IF NEW.preco < 0 THEN
        SET NEW.preco = 0;
    END IF;

    IF NEW.estoque < 0 THEN
        SET NEW.estoque = 0;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produto_categoria`
--

CREATE TABLE `produto_categoria` (
  `id_produto` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produto_categoria`
--

INSERT INTO `produto_categoria` (`id_produto`, `id_categoria`) VALUES
(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 1),
(8, 1),
(9, 1),
(10, 1),
(11, 3),
(13, 3),
(14, 3),
(15, 3),
(16, 3),
(17, 3),
(18, 3),
(19, 3),
(20, 3),
(21, 2),
(22, 2),
(23, 2),
(24, 2),
(25, 2),
(26, 4),
(27, 4),
(28, 4),
(29, 4),
(30, 4),
(31, 4),
(32, 4),
(33, 4),
(34, 3),
(35, 3);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nome`, `email`, `senha`, `endereco`, `data_cadastro`) VALUES
(1, 'primeiro cliente', 'cliente.teste@darkmoon.com', '$2y$10$INDUyookzmboRKusZgXScOEqRjsenk5n83ex525WT90F0UpEYN8fa', 'Rua das Sombras, 666', '2026-08-22 01:51:09'),
(2, 'joao alfredo', 'jalfredo2303@gmail.com', '$2y$10$rzzBrJiynxc/aL3SCA51E.MpaMNtbCmIH1zJElvct9SRk8RxmU2Pi', 'rua jucelino', '2026-08-22 02:31:04'),
(3, 'JOAO_larp', 'Larplarp@gmail.com', '$2y$10$6K3G2Fzgv/6t5nSZILcdBOi8ePg4CoIUQYzkS6NT79svStSbtk8Ri', 'rua jucelino', '2026-09-14 15:51:36');

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `vw_produtos_completo`
-- (Veja abaixo para a visão atual)
--
CREATE TABLE `vw_produtos_completo` (
`id_produto` int(11)
,`nome` varchar(150)
,`descricao` text
,`preco` decimal(10,2)
,`estoque` int(11)
,`genero` enum('Masculino','Feminino','Unissex')
,`categoria` varchar(100)
,`quantidade_vendida` decimal(32,0)
,`faturamento_gerado` decimal(42,2)
);

-- --------------------------------------------------------

--
-- Estrutura para view `vw_produtos_completo`
--
CREATE TABLE IF NOT EXISTS `vw_produtos_completo`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_produtos_completo`  AS SELECT `p`.`id_produto` AS `id_produto`, `p`.`nome` AS `nome`, `p`.`descricao` AS `descricao`, `p`.`preco` AS `preco`, `p`.`estoque` AS `estoque`, `p`.`genero` AS `genero`, `c`.`nome` AS `categoria`, coalesce(sum(`ip`.`quantidade`),0) AS `quantidade_vendida`, coalesce(sum(`ip`.`quantidade` * `ip`.`preco_unitario`),0) AS `faturamento_gerado` FROM (((`produtos` `p` left join `produto_categoria` `pc` on(`pc`.`id_produto` = `p`.`id_produto`)) left join `categorias` `c` on(`c`.`id_categoria` = `pc`.`id_categoria`)) left join `itens_pedido` `ip` on(`ip`.`id_produto` = `p`.`id_produto`)) GROUP BY `p`.`id_produto`, `p`.`nome`, `p`.`descricao`, `p`.`preco`, `p`.`estoque`, `p`.`genero`, `c`.`nome` ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`);

--
-- Índices de tabela `cupons`
--
ALTER TABLE `cupons`
  ADD PRIMARY KEY (`id_cupom`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Índices de tabela `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD PRIMARY KEY (`id_pedido`,`id_produto`),
  ADD KEY `id_produto` (`id_produto`);

--
-- Índices de tabela `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id_produto`);

--
-- Índices de tabela `produto_categoria`
--
ALTER TABLE `produto_categoria`
  ADD PRIMARY KEY (`id_produto`,`id_categoria`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `cupons`
--
ALTER TABLE `cupons`
  MODIFY `id_cupom` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id_produto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `itens_pedido`
--
ALTER TABLE `itens_pedido`
  ADD CONSTRAINT `itens_pedido_ibfk_1` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
  ADD CONSTRAINT `itens_pedido_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE;

--
-- Restrições para tabelas `produto_categoria`
--
ALTER TABLE `produto_categoria`
  ADD CONSTRAINT `produto_categoria_ibfk_1` FOREIGN KEY (`id_produto`) REFERENCES `produtos` (`id_produto`) ON DELETE CASCADE,
  ADD CONSTRAINT `produto_categoria_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
