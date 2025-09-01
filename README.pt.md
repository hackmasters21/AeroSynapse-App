# AeroSynapse - Sistema Integrado de Consciência Situacional e Planejamento de Voo

**AeroSynapse** é uma ferramenta web avançada de consciência situacional e planejamento de voo projetada para pilotos profissionais e de aviação geral. Combina dados de tráfego aéreo em tempo real, informações meteorológicas multi-fonte, planejamento de rotas e análise de segurança histórica em uma interface web unificada e profissional.

## 🚀 Características Principais

### 🛩️ Tráfego Aéreo em Tempo Real
- Visualização de aeronaves em tempo real estilo FlightRadar24
- Informações detalhadas de cada aeronave (matrícula, tipo, origem/destino)
- Filtros avançados por altitude, tipo de aeronave, companhia aérea
- Alertas de proximidade e detecção de conflitos

### ⚠️ Sistema de Prevenção de Colisões (tipo TCAS)
- Algoritmos avançados de detecção de proximidade
- Alertas visuais e auditivos para conflitos potenciais
- Cálculo de tempo até aproximação mais próxima
- Sugestões de resolução baseadas em regras do ar

### 🌦️ Módulo de Meteorologia Avançada
- **Agregação multi-fonte** de dados meteorológicos (AWC, NOAA, EUMETSAT, RainViewer)
- **Sistema de confiança** que avalia concordância entre fontes
- **METARs, TAFs e SIGMETs** em tempo real
- **Overlays meteorológicos** (radar, satélite, ventos em altitude)
- **Índice de confiança** para tomada de decisões informada

### 🛡️ Módulo de Segurança e Histórico de Acidentes
- **Base de dados de acidentes** (NTSB, Aviation Safety Network)
- **Análise de risco por localização** com múltiplos fatores
- **Visualização de acidentes históricos** no mapa
- **Estatísticas de segurança** e tendências temporais
- **Alertas de segurança automáticos** por clusters de acidentes

### 🗺️ Planejamento de Rotas Inteligente
- Calculadora de rotas diretas e por airways
- Base de dados completa de aeroportos e waypoints
- Informações de combustível, tempo e distância
- Integração com cartas de navegação

### 🌐 Informações de Espaço Aéreo (FIR)
- Visualização de fronteiras FIR, CTR, TMA
- Base de dados de auxílios à navegação (VOR, DME, NDB, ILS)
- Espaços aéreos restritos e perigosos
- Frequências e procedimentos específicos

### 🌍 Suporte Multi-idioma
- **Inglês, Espanhol, Português e Francês**
- **Mudança dinâmica** de idioma
- **Detecção automática** do idioma do navegador
- **Interface completamente traduzida**

### 🎨 Interface de Usuário Profissional
- **Modo noturno** otimizado para cabine
- **Painéis redimensionáveis** e personalizáveis
- **Cores padrão da aviação** para interpretação rápida
- **Design responsivo** para diferentes dispositivos
- **Ferramenta web** acessível de qualquer navegador

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Material-UI** para componentes
- **Leaflet** para mapas interativos
- **Socket.IO** para comunicação em tempo real
- **React-i18next** para internacionalização
- **Context API** para gerenciamento de estado

### Backend
- **Node.js** com Express e TypeScript
- **PostgreSQL** com PostGIS para dados geoespaciais
- **Socket.IO** para WebSocket
- **Winston** para logging
- **Joi** para validação de dados
- **APIs externas** para dados meteorológicos e de segurança

## 📁 Estrutura do Projeto

```
AeroSynapse/
├── frontend/          # Aplicação React Web
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos de Estado
│   │   ├── hooks/         # Hooks Personalizados
│   │   ├── i18n/          # Sistema de Internacionalização
│   │   ├── services/      # Serviços de API
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilitários
│   └── public/        # Arquivos Estáticos
├── backend/           # API e Serviços
│   ├── src/
│   │   ├── config/        # Configuração
│   │   ├── database/      # Base de Dados
│   │   ├── middleware/    # Middleware
│   │   ├── routes/        # Rotas da API
│   │   ├── services/      # Lógica de Negócio
│   │   └── utils/         # Utilitários
│   └── .env.example   # Variáveis de Ambiente
├── docs/              # Documentação
└── README.md          # Este Arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18 ou superior
- PostgreSQL 14+ com PostGIS
- npm ou yarn

### Instalação

1. **Clonar o repositório:**
   ```bash
   git clone <repository-url>
   cd AeroSynapse
   ```

2. **Instalar dependências do frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Instalar dependências do backend:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Editar .env com suas configurações
   ```

5. **Configurar base de dados PostgreSQL:**
   ```sql
   CREATE DATABASE aerosynapse;
   CREATE USER aerosynapse_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aerosynapse TO aerosynapse_user;
   
   -- Conectar à base de dados e habilitar PostGIS
   \c aerosynapse
   CREATE EXTENSION postgis;
   ```

6. **Compilar TypeScript:**
   ```bash
   npm run build
   ```

7. **Iniciar serviços:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🌍 Suporte de Idiomas

A aplicação detecta automaticamente o idioma do navegador e suporta:
- 🇺🇸 **Inglês** (Padrão)
- 🇪🇸 **Espanhol**
- 🇧🇷 **Português**
- 🇫🇷 **Francês**

Os usuários podem alterar o idioma usando o seletor de idioma na interface.

## 📖 Documentação

- [README em Inglês](README.en.md)
- [README em Espanhol](README.md)
- [README em Português](README.pt.md)
- [README em Francês](README.fr.md)
- [Documentação do Backend](backend/README.md)

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch de feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -am 'Adicionar nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Crie um Pull Request

## 📄 Licença

Licença MIT - veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para suporte técnico ou questões:
- Crie uma issue no GitHub
- Contate a equipe de desenvolvimento
- Revise a documentação em `/docs`

---

**AeroSynapse** - Ferramenta profissional de consciência situacional e planejamento de voo para aviação.