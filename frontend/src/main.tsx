import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import { Layout } from "./componentes/Layout";
import { RotaProtegida } from "./componentes/RotaProtegida";
import { AuthProvider } from "./contexto/AuthProvider";
import { CarrinhoProvider } from "./contexto/CarrinhoProvider";
import { AdminPage } from "./pages/AdminPage";
import { CadastroPage } from "./pages/CadastroPage";
import { CarrinhoPage } from "./pages/CarrinhoPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProdutosPage } from "./pages/ProdutosPage";
import { PromocoesPage } from "./pages/PromocoesPage";
import { SobrePage } from "./pages/SobrePage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CarrinhoProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/produtos" element={<ProdutosPage />} />
              <Route path="/promocoes" element={<PromocoesPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/carrinho" element={<CarrinhoPage />} />
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/login" element={<LoginPage />} />
              {/* Só administrador: usuário comum vê "Acesso restrito"; sem login vai para /login */}
              <Route element={<RotaProtegida papel="admin" />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </CarrinhoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
