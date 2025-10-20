import React, { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const ApiDocumentation = () => {
  const [apiToken, setApiToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const handleGenerateApiToken = async () => {
    setIsGeneratingToken(true);
    setTokenError(null);
    try {
      const response = await axiosInstance.post("/tokens/api-token");
      setApiToken(response.data.token);
      setTokenExpiresAt(new Date(response.data.expiresAt).toLocaleDateString());
    } catch (err) {
      setTokenError(err.response?.data?.message || "Falha ao gerar o token da API.");
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const sections = [
    {
      title: "Autenticação / Authentication",
      description: "Para usar a maioria dos endpoints da API, você precisará de um token de autenticação. Este token deve ser enviado no cabeçalho `Authorization` como um token Bearer. Você pode gerar um token de API abaixo.",
      endpoints: [
        {
          name: "Gerar Token de API / Generate API Token",
          method: "POST",
          path: "/api/tokens/api-token",
          description: "Gera um novo token de API para o usuário autenticado. Este token pode ser usado para acessar outros endpoints protegidos da API.",
        },
        {
          name: "Registrar Usuário / Register User",
          method: "POST",
          path: "/api/auth/register",
          description:
            "Cria um novo usuário. / Registers a new user.",
          body: {
            username: "string (obrigatório / required)",
            password: "string (obrigatório / required)",
            role: "string ('RESELLER', 'MASTER_RESELLER', 'SUPER_ADMIN')",
            createdById: "number (opcional / optional)",
          },
        },
        {
          name: "Login de Usuário / Login User",
          method: "POST",
          path: "/api/auth/login",
          description:
            "Autentica o usuário e retorna um token JWT. / Authenticates user and returns a JWT token.",
          body: {
            username: "string",
            password: "string",
          },
        },
      ],
    },
    {
      title: "Playlists / Playlists",
      description: "Gerencie a playlist mestra que é servida aos seus clientes. A playlist mestra é gerada a partir dos arquivos .m3u na pasta M3U do servidor e pode ser editada manualmente.",
      endpoints: [
        {
          name: "Gerar playlist M3U para Cliente / Generate Client M3U Playlist",
          method: "GET",
          path: "/api/playlists/get.php",
          description:
            "Gera a playlist M3U de um cliente com base na playlist mestra. Requer autenticação via query params (username e password do cliente).",
          query: {
            username: "string",
            password: "string",
          },
        },
        {
          name: "Sincronizar Playlist Mestra da Pasta M3U / Synchronize Master Playlist from M3U Folder",
          method: "POST",
          path: "/api/playlists/sync-master",
          description: "Lê todos os arquivos .m3u da pasta M3U do servidor, mescla seus conteúdos e atualiza a playlist mestra no banco de dados. Isso aciona o reprocessamento da playlist mestra.",
        },
        {
          name: "Obter Streams da Playlist Mestra / Get Master Playlist Streams",
          method: "GET",
          path: "/api/playlists/master/streams",
          description: "Retorna todos os streams que compõem a playlist mestra.",
        },
        {
          name: "Adicionar Stream à Playlist Mestra / Add Stream to Master Playlist",
          method: "POST",
          path: "/api/playlists/master/streams",
          description: "Adiciona um novo stream à playlist mestra. Isso aciona o reprocessamento da playlist mestra.",
          body: {
            name: "string (obrigatório / required)",
            streamUrl: "string (obrigatório / required)",
          },
        },
        {
          name: "Atualizar Stream na Playlist Mestra / Update Stream in Master Playlist",
          method: "PUT",
          path: "/api/playlists/master/streams/:streamId",
          description: "Atualiza um stream existente na playlist mestra pelo seu ID. Isso aciona o reprocessamento da playlist mestra.",
          body: {
            name: "string (obrigatório / required)",
            streamUrl: "string (obrigatório / required)",
          },
        },
        {
          name: "Remover Stream da Playlist Mestra / Remove Stream from Master Playlist",
          method: "DELETE",
          path: "/api/playlists/master/streams/:streamId",
          description: "Remove um stream da playlist mestra pelo seu ID. Isso aciona o reprocessamento da playlist mestra.",
        },
        {
          name: "Obter Conteúdo da Pasta M3U / Get M3U Folder Content",
          method: "GET",
          path: "/api/playlists/m3u-folder-content",
          description: "Retorna o conteúdo (streams) de todos os arquivos .m3u encontrados na pasta M3U do servidor. Útil para referência.",
        },
      ],
    },
    {
      title: "Clientes / Clients",
      endpoints: [
        {
          name: "Obter todos os clientes / Get All Clients",
          method: "GET",
          path: "/api/clients",
          description:
            "Retorna todos os clientes do revendedor autenticado. / Returns all clients for the logged-in reseller.",
        },
        {
          name: "Criar novo cliente / Create New Client",
          method: "POST",
          path: "/api/clients",
          description:
            "Cria um novo cliente vinculado ao revendedor. / Creates a new client linked to the reseller.",
          body: {
            username: "string",
            password: "string",
            duration: "number (0 = vitalício / lifetime)",
            durationUnit: "string ('minutes', 'hours', 'days', 'months')",
          },
        },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Documentação da API
      </h1>
      <p className="text-sm text-gray-600 mb-8 text-center">
        Esta documentação detalha os endpoints da API para integração com sistemas externos.
      </p>

      <div className="mb-6 border rounded-2xl shadow-sm bg-white overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b">
          <h2 className="text-xl font-semibold text-blue-700">
            Geração de Token de API
          </h2>
        </div>
        <div className="p-4">
          <p className="mb-3 text-gray-700">
            Para acessar os endpoints protegidos da API, você precisa de um token de autenticação. Clique no botão abaixo para gerar um token pessoal. Este token deve ser incluído no cabeçalho `Authorization` de suas requisições como `Bearer SEU_TOKEN`.
          </p>
          <button
            onClick={handleGenerateApiToken}
            disabled={isGeneratingToken}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isGeneratingToken ? "Gerando..." : "Gerar Token de API"}
          </button>
          {tokenError && <p className="text-red-500 mt-2">Erro: {tokenError}</p>}
          {apiToken && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p className="font-semibold">Seu Token de API:</p>
              <pre className="bg-gray-900 text-green-200 text-xs p-3 rounded-lg mt-1 overflow-x-auto">
                {apiToken}
              </pre>
              <p className="font-semibold mt-2">Expira em: {tokenExpiresAt}</p>
              <p className="font-semibold mt-2">Exemplo de Uso (cURL):</p>
              <pre className="bg-gray-900 text-green-200 text-xs p-3 rounded-lg mt-1 overflow-x-auto">
                {`curl -X GET "${window.location.origin}/api/playlists/master/streams" \
     -H "Authorization: Bearer ${apiToken}"`}
              </pre>
            </div>
          )}
        </div>
      </div>

      {sections.map((section, i) => (
        <div
          key={i}
          className="mb-6 border rounded-2xl shadow-sm bg-white overflow-hidden"
        >
          <div className="bg-blue-50 px-4 py-3 border-b">
            <h2 className="text-xl font-semibold text-blue-700">
              {section.title}
            </h2>
          </div>
          {section.description && (
            <p className="p-4 text-gray-700 text-sm border-b">{section.description}</p>
          )}
          <div className="divide-y">
            {section.endpoints.map((ep, j) => (
              <details key={j} className="p-4 hover:bg-gray-50">
                <summary className="cursor-pointer font-semibold text-gray-800">
                  {ep.name}
                </summary>

                <div className="mt-3 pl-3 text-sm">
                  <p className="mb-2">
                    <strong>Método / Method:</strong>{" "}
                    <span className="text-blue-600">{ep.method}</span>
                  </p>
                  <p className="mb-2">
                    <strong>Endpoint:</strong>{" "}
                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
                      {ep.path}
                    </span>
                  </p>
                  {ep.description && <p className="mb-3 text-gray-700">{ep.description}</p>}

                  {ep.body && (
                    <div className="mb-3">
                      <strong>Exemplo de corpo / Request body:</strong>
                      <pre className="bg-gray-900 text-green-200 text-xs p-3 rounded-lg mt-1 overflow-x-auto">
                        {JSON.stringify(ep.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {ep.query && (
                    <div className="mb-3">
                      <strong>Parâmetros / Query params:</strong>
                      <pre className="bg-gray-900 text-green-200 text-xs p-3 rounded-lg mt-1 overflow-x-auto">
                        {JSON.stringify(ep.query, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}

      <footer className="text-center text-gray-500 text-xs mt-8">
        Última atualização / Last updated: {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
};

export default ApiDocumentation;