export function SobrePage() {
  return (
    <section>
      <div className="hero">
        <h1>Sobre Nós</h1>
        <p>A história por trás da DarkMoon Store</p>
      </div>

      <div className="duas-colunas">
        <div>
          <h2 className="titulo-vinho">Como tudo começou</h2>
          <p>
            A DarkMoon Store nasceu da vontade de uma única pessoa: a Camila, moradora de Santa Catarina e
            apaixonada por moda alternativa há mais de 10 anos. Depois de anos rodando lojas físicas e perfis
            de Instagram atrás de roupas góticas e dark que combinassem com o estilo dela, ela percebeu um
            problema recorrente: quase todas as lojas do nicho focavam só em um público — ou era tudo voltado
            pra moda feminina, ou tudo masculino, sem opções unissex de verdade.
          </p>
          <p>
            Cansada de não encontrar uma loja que vendesse pras duas, ela decidiu criar a própria — e nos
            procurou em 2026 pra transformar essa ideia em realidade.
          </p>
        </div>
        <blockquote className="citacao">
          <p>
            "Eu não queria só mais uma loja. Eu queria um espaço onde qualquer pessoa, independente de gênero,
            pudesse encontrar peças que combinassem com a identidade dela. Foi assim que a DarkMoon nasceu."
          </p>
          <footer>— Camila, fundadora da DarkMoon Store</footer>
        </blockquote>
      </div>

      <hr className="divisor" />
      <h2 className="titulo-secao">O que nos diferencia</h2>
      <div className="tres-colunas">
        <div>
          <h3>Moda para todos os gêneros</h3>
          <p className="texto-suave">Camisas, vestidos, botas e acessórios pensados pra quem se identifica com o estilo dark — sem rótulos.</p>
        </div>
        <div>
          <h3>Curadoria autêntica</h3>
          <p className="texto-suave">Cada peça é escolhida a dedo, unindo elegância sombria com qualidade no dia a dia.</p>
        </div>
        <div>
          <h3>Feito com propósito</h3>
          <p className="texto-suave">Uma loja pequena, catarinense, criada por quem entende a falta que esse espaço fazia.</p>
        </div>
      </div>

      <hr className="divisor" />
      <div className="centro">
        <h2 className="titulo-secao">Nossa missão</h2>
        <p className="missao">
          Levar o estilo gótico e alternativo pra mais perto de quem ama esse universo, oferecendo peças
          versáteis, sem distinção de gênero, com a mesma paixão que deu origem à loja: a vontade de pertencer
          a um lugar que reflita quem você é.
        </p>
      </div>
    </section>
  );
}
