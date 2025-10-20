import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
// CORREÇÃO: Importamos o Hook 'useAuth' diretamente do AuthContext
import { useAuth } from '../../context/AuthContext'; 
// A importação do AuthContext não é mais necessária aqui, mas se estivesse, seria:
// import { AuthContext, useAuth } from '../../context/AuthContext'; 

const ProtectedRoute = () => {
    // O Hook useAuth agora é importado corretamente e pode ser chamado
    const { isAuthenticated } = useAuth();

    // Se autenticado, renderiza as rotas filhas
    // Se não, redireciona para a página de login
    return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;