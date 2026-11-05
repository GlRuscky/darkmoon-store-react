// Gerado a partir do database.sql original (INSERT INTO produtos / cupons)
export type ProdutoSeed = {
  id: number; nome: string; descricao: string; preco: number; estoque: number;
  imagem: string; genero: 'Masculino' | 'Feminino' | 'Unissex';
  categoria: 'Camisas' | 'Vestidos' | 'Botas' | 'Acessórios';
};

export const PRODUTOS_SEED: ProdutoSeed[] = [
  {
    "id": 1,
    "nome": "Camisa Raven Wings",
    "descricao": "Camisa feminina preta com estampa de cruz alada gótica em prata",
    "preco": 89.9,
    "estoque": 15,
    "imagem": "camisa-feminina1.webp",
    "genero": "Feminino",
    "categoria": "Camisas"
  },
  {
    "id": 2,
    "nome": "Camisa Kitty Thorn",
    "descricao": "Camisa oversized preta com Hello Kitty cercada por espinhos e design dark",
    "preco": 94.9,
    "estoque": 12,
    "imagem": "camisa-feminina2.webp",
    "genero": "Feminino",
    "categoria": "Camisas"
  },
  {
    "id": 3,
    "nome": "Camisa Tracker Angel",
    "descricao": "Camisa preta com estampa \"TRACKER\" guitarra e anjo com estrelas",
    "preco": 89.9,
    "estoque": 10,
    "imagem": "camisa-feminina3.webp",
    "genero": "Feminino",
    "categoria": "Camisas"
  },
  {
    "id": 4,
    "nome": "Camisa Attitude Flame",
    "descricao": "Camisa branca oversized com manga preta e logo \"ATTITUDE\" em estilo flamejante",
    "preco": 79.9,
    "estoque": 18,
    "imagem": "camisa-feminina4.webp",
    "genero": "Feminino",
    "categoria": "Camisas"
  },
  {
    "id": 5,
    "nome": "Camisa Thorn Cross",
    "descricao": "Camisa preta justa com grande estampa de cruz espinhenta prateada",
    "preco": 85.9,
    "estoque": 14,
    "imagem": "camisa-feminina5.webp",
    "genero": "Feminino",
    "categoria": "Camisas"
  },
  {
    "id": 6,
    "nome": "Camisa Raven Skeleton",
    "descricao": "Camisa masculina preta com estampa de corvo esquelético vermelho sangrento",
    "preco": 99.9,
    "estoque": 12,
    "imagem": "camisa-masculina1.webp",
    "genero": "Masculino",
    "categoria": "Camisas"
  },
  {
    "id": 7,
    "nome": "Camisa Ghost Distressed",
    "descricao": "Camisa masculina preta destroyed com estampa \"GHOST\" em tie-dye vermelho e preto",
    "preco": 109.9,
    "estoque": 8,
    "imagem": "camisa-masculina2.webp",
    "genero": "Masculino",
    "categoria": "Camisas"
  },
  {
    "id": 8,
    "nome": "Camisa Dark Layered",
    "descricao": "Camisa masculina preta com manga longa cinza e estampa gráfica gótica",
    "preco": 95.9,
    "estoque": 10,
    "imagem": "camisa-masculina3.webp",
    "genero": "Masculino",
    "categoria": "Camisas"
  },
  {
    "id": 9,
    "nome": "Camisa Angel Throne",
    "descricao": "Blusão cinza com estampa detalhada de anjo no trono e mangas com lettering",
    "preco": 119.9,
    "estoque": 9,
    "imagem": "camisa-masculina4.webp",
    "genero": "Masculino",
    "categoria": "Camisas"
  },
  {
    "id": 10,
    "nome": "Camisa Dark Anime",
    "descricao": "Camisa masculina preta washed com ilustração dark anime de figura mística",
    "preco": 89.9,
    "estoque": 15,
    "imagem": "camisa-masculina5.webp",
    "genero": "Masculino",
    "categoria": "Camisas"
  },
  {
    "id": 11,
    "nome": "Bota Feminina Midnight Bow",
    "descricao": "Bota feminina preta peluciada com laços",
    "preco": 199.9,
    "estoque": 10,
    "imagem": "bota-feminina1.webp",
    "genero": "Feminino",
    "categoria": "Botas"
  },
  {
    "id": 12,
    "nome": "Bota Feminina Crimson Chain",
    "descricao": "Bota feminina preta e vermelha com correntes",
    "preco": 219.9,
    "estoque": 10,
    "imagem": "bota-feminina2.webp",
    "genero": "Feminino",
    "categoria": "Botas"
  },
  {
    "id": 13,
    "nome": "Bota Feminina Dark Heel",
    "descricao": "Bota feminina preta com salto alto e detalhes dourados",
    "preco": 229.9,
    "estoque": 10,
    "imagem": "bota-feminina3.webp",
    "genero": "Feminino",
    "categoria": "Botas"
  },
  {
    "id": 14,
    "nome": "Bota Feminina Pink Star",
    "descricao": "Bota feminina rosa com plataforma e correntes de estrela",
    "preco": 239.9,
    "estoque": 10,
    "imagem": "bota-feminina4.webp",
    "genero": "Feminino",
    "categoria": "Botas"
  },
  {
    "id": 15,
    "nome": "Bota Feminina Heart Punk",
    "descricao": "Bota feminina preta de cano alto com fivelas de coração",
    "preco": 259.9,
    "estoque": 10,
    "imagem": "bota-feminina5.webp",
    "genero": "Feminino",
    "categoria": "Botas"
  },
  {
    "id": 16,
    "nome": "Bota Masculina Skull Strap",
    "descricao": "Bota masculina preta de cano alto com fivelas de caveira",
    "preco": 279.9,
    "estoque": 10,
    "imagem": "bota-masculina1.webp",
    "genero": "Masculino",
    "categoria": "Botas"
  },
  {
    "id": 17,
    "nome": "Bota Masculina Dark Rider",
    "descricao": "Bota masculina preta e vinho com cadarço e fivela",
    "preco": 269.9,
    "estoque": 10,
    "imagem": "bota-masculina2.webp",
    "genero": "Masculino",
    "categoria": "Botas"
  },
  {
    "id": 18,
    "nome": "Bota Masculina Chain Combat",
    "descricao": "Bota masculina preta com correntes e solado tratorado",
    "preco": 249.9,
    "estoque": 10,
    "imagem": "bota-masculina3.webp",
    "genero": "Masculino",
    "categoria": "Botas"
  },
  {
    "id": 19,
    "nome": "Bota Masculina Buckle Combat",
    "descricao": "Bota masculina preta com múltiplas fivelas",
    "preco": 249.9,
    "estoque": 10,
    "imagem": "bota-masculina4.webp",
    "genero": "Masculino",
    "categoria": "Botas"
  },
  {
    "id": 20,
    "nome": "Bota Masculina Glossy Night",
    "descricao": "Bota masculina preta envernizada com cadarço",
    "preco": 259.9,
    "estoque": 10,
    "imagem": "bota-masculina5.webp",
    "genero": "Masculino",
    "categoria": "Botas"
  },
  {
    "id": 21,
    "nome": "Vestido Velvet Lace",
    "descricao": "Vestido curto preto de veludo com mangas longas de renda e decote quadrado",
    "preco": 159.9,
    "estoque": 10,
    "imagem": "vestido1.webp",
    "genero": "Feminino",
    "categoria": "Vestidos"
  },
  {
    "id": 22,
    "nome": "Vestido Off-Shoulder Gothic",
    "descricao": "Vestido preto tomara-que-caia de renda com saia assimétrica e luvas longas",
    "preco": 169.9,
    "estoque": 8,
    "imagem": "vestido2.webp",
    "genero": "Feminino",
    "categoria": "Vestidos"
  },
  {
    "id": 23,
    "nome": "Vestido White Siren",
    "descricao": "Vestido branco em renda com mangas flare, corset e saia irregular assimétrica",
    "preco": 149.9,
    "estoque": 12,
    "imagem": "vestido3.webp",
    "genero": "Feminino",
    "categoria": "Vestidos"
  },
  {
    "id": 24,
    "nome": "Vestido Corset Noir",
    "descricao": "Vestido preto curto em corset com laço, renda e detalhes de liga",
    "preco": 179.9,
    "estoque": 9,
    "imagem": "vestido4.webp",
    "genero": "Feminino",
    "categoria": "Vestidos"
  },
  {
    "id": 25,
    "nome": "Vestido Crimson Velvet",
    "descricao": "Vestido vermelho em veludo com corset, camadas de renda preta e saia assimétrica",
    "preco": 189.9,
    "estoque": 7,
    "imagem": "vestido5.webp",
    "genero": "Feminino",
    "categoria": "Vestidos"
  },
  {
    "id": 26,
    "nome": "Colar Rosário Raven Cross",
    "descricao": "Colar longo estilo rosário gótico com cruz ornamentada e pingente de coração",
    "preco": 79.9,
    "estoque": 15,
    "imagem": "acessorio1.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 27,
    "nome": "Colar Teia de Aranha",
    "descricao": "Colar statement em prata com design de teia de aranha e pingente de caveira",
    "preco": 89.9,
    "estoque": 12,
    "imagem": "acessorio2.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 28,
    "nome": "Choker Spiked Punk",
    "descricao": "Choker preto de couro com spikes prateados grandes",
    "preco": 59.9,
    "estoque": 20,
    "imagem": "acessorio3.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 29,
    "nome": "Colar Layered Cross",
    "descricao": "Colar duplo em prata com cruz gótica detalhada e contas pretas",
    "preco": 69.9,
    "estoque": 18,
    "imagem": "acessorio4.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 30,
    "nome": "Colar Rosário Blue Stone",
    "descricao": "Colar rosário gótico com pedra azul central, contas pretas e cruz ornamental",
    "preco": 85.9,
    "estoque": 14,
    "imagem": "acessorio5.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 31,
    "nome": "Pulseira Spikes Classic",
    "descricao": "Pulseira de couro preta com spikes prateados",
    "preco": 49.9,
    "estoque": 25,
    "imagem": "acessorio6.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 32,
    "nome": "Pulseira Skull Chain",
    "descricao": "Pulseira larga preta com spikes, caveiras, estrelas e correntes penduradas",
    "preco": 94.9,
    "estoque": 10,
    "imagem": "acessorio7.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  },
  {
    "id": 33,
    "nome": "Pulseira Pyramid Studs",
    "descricao": "Pulseira de couro preta com pirâmides prateadas e rebites",
    "preco": 64.9,
    "estoque": 16,
    "imagem": "acessorio8.webp",
    "genero": "Unissex",
    "categoria": "Acessórios"
  }
];

export const CUPONS_SEED = [
  {
    "codigo": "DARK10",
    "percentual": 10
  },
  {
    "codigo": "MOON15",
    "percentual": 15
  },
  {
    "codigo": "GOTICA20",
    "percentual": 20
  },
  {
    "codigo": "BLACKFRIDAY",
    "percentual": 30
  }
];
