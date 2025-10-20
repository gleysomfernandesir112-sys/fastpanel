import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// CORRE��O: Importamos o Hook 'useAuth' diretamente do AuthContext
import { useAuth } from '../../context/AuthContext'; 
// A importa��o do AuthContext n�o � mais necess�ria aqui, mas se estivesse, seria:
// import { AuthContext, useAuth } from '../../context/AuthContext'; 

const ProtectedRoute = () => {
    // O Hook useAuth agora � importado corretamente e pode ser chamado
    const { isAuthenticated } = useAuth();

    // Se autenticado, renderiza as rotas filhas
    // Se n�o, redireciona para a p�gina de login
    return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;