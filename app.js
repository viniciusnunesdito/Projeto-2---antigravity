// app.js

// Inicialização do Banco de Dados Simulado no localStorage
const initDatabase = () => {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('todos')) {
        localStorage.setItem('todos', JSON.stringify([]));
    }
};

// Funções utilitárias para ler/gravar dados no localStorage
const getUsers = () => JSON.parse(localStorage.getItem('users')) || [];
const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

const getTodos = () => JSON.parse(localStorage.getItem('todos')) || [];
const saveTodos = (todos) => localStorage.setItem('todos', JSON.stringify(todos));

const getCurrentUser = () => JSON.parse(localStorage.getItem('currentUser')) || null;
const setCurrentUser = (user) => localStorage.setItem('currentUser', JSON.stringify(user));
const removeCurrentUser = () => localStorage.removeItem('currentUser');

// Estado Global da Aplicação
let currentUser = null;

// Mapeamento de Telas
const screens = {
    login: document.getElementById('screen-login'),
    register: document.getElementById('screen-register'),
    dashboard: document.getElementById('screen-dashboard')
};

// Função para transição de telas
const showScreen = (screenName) => {
    Object.keys(screens).forEach(key => {
        if (key === screenName) {
            screens[key].classList.remove('hidden');
        } else {
            screens[key].classList.add('hidden');
        }
    });
    clearAllErrors();
};

// Limpa mensagens de erro inline e gerais dos formulários
const clearAllErrors = () => {
    // Oculta alertas gerais do login
    document.getElementById('login-error-general').classList.add('hidden');
    document.getElementById('login-success-general').classList.add('hidden');
    
    // Oculta erros de criação de To-Do
    const todoTitleError = document.getElementById('todo-title-error');
    if (todoTitleError) {
        todoTitleError.classList.add('hidden');
        todoTitleError.textContent = '';
    }

    // Oculta erros inline específicos de inputs em geral
    const errorSpans = document.querySelectorAll('[id$="-error"]');
    errorSpans.forEach(span => {
        span.classList.add('hidden');
        span.textContent = '';
    });
    
    // Restaura a borda padrão de todos os inputs e textareas
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('border-red-500');
    });
};

// Exibe mensagem de erro inline para um input específico
const showInlineError = (inputId, message) => {
    const input = document.getElementById(inputId);
    const errorSpan = document.getElementById(`${inputId}-error`);
    if (input && errorSpan) {
        input.classList.add('border-red-500');
        errorSpan.textContent = message;
        errorSpan.classList.remove('hidden');
    }
};

// Função auxiliar para escapar caracteres HTML prevenindo XSS
const escapeHTML = (string) => {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return string.replace(/[&<>"']/g, function(m) { return map[m]; });
};

// ==========================================
// TELA DE LOGIN: FLUXO E VALIDAÇÕES
// ==========================================

const handleLogin = (e) => {
    e.preventDefault();
    clearAllErrors();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    // Validação de e-mail vazio
    if (!email) {
        showInlineError('login-email', 'O campo de e-mail não pode estar vazio.');
        hasError = true;
    }

    // Validação de senha vazia
    if (!password) {
        showInlineError('login-password', 'A chave de acesso não pode estar vazia.');
        hasError = true;
    }

    if (hasError) return;

    // Autenticação contra o banco de dados simulado
    const users = getUsers();
    const userFound = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!userFound) {
        const errorDiv = document.getElementById('login-error-general');
        const errorText = document.getElementById('login-error-general-text');
        errorText.textContent = 'Erro: Credencial de operador não cadastrada no sistema.';
        errorDiv.classList.remove('hidden');
        return;
    }

    if (userFound.password !== password) {
        const errorDiv = document.getElementById('login-error-general');
        const errorText = document.getElementById('login-error-general-text');
        errorText.textContent = 'Erro: Chave de acesso inválida para este operador.';
        errorDiv.classList.remove('hidden');
        return;
    }

    // Login bem-sucedido
    currentUser = userFound;
    setCurrentUser(userFound);
    
    // Limpar os campos do formulário para segurança
    emailInput.value = '';
    passwordInput.value = '';

    // Ir para a dashboard
    loadDashboard();
};

// ==========================================
// TELA DE CADASTRO: FLUXO E VALIDAÇÕES
// ==========================================

const handleRegister = (e) => {
    e.preventDefault();
    clearAllErrors();

    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    // Validação de nome
    if (!name) {
        showInlineError('register-name', 'O nome do operador é obrigatório.');
        hasError = true;
    }

    // Validação de e-mail
    if (!email) {
        showInlineError('register-email', 'O e-mail é obrigatório.');
        hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInlineError('register-email', 'Por favor, insira um formato de e-mail válido.');
        hasError = true;
    }

    // Validação de senha
    if (!password) {
        showInlineError('register-password', 'A chave de acesso é obrigatória.');
        hasError = true;
    } else if (password.length < 6) {
        showInlineError('register-password', 'A chave de acesso precisa ter pelo menos 6 caracteres.');
        hasError = true;
    }

    if (hasError) return;

    // Verificar se o e-mail já existe
    const users = getUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (emailExists) {
        showInlineError('register-email', 'Este endereço de e-mail já está registrado no sistema.');
        return;
    }

    // Criar e salvar novo usuário
    const newOperator = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name,
        email,
        password // Armazenamento em texto puro para simular o db.json
    };

    users.push(newOperator);
    saveUsers(users);

    // Resetar formulário
    nameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';

    // Ir para tela de login com feedback de sucesso
    showScreen('login');
    const successDiv = document.getElementById('login-success-general');
    const successText = document.getElementById('login-success-general-text');
    successText.textContent = 'Cadastro concluído com sucesso. Operador liberado para acesso.';
    successDiv.classList.remove('hidden');
};

// ==========================================
// TELA DO DASHBOARD: TAREFAS (TO-DO) E LOGOUT
// ==========================================

// Configura dados da tela de Dashboard
const loadDashboard = () => {
    if (!currentUser) return;
    
    // Atualiza cabeçalho do operador (Olá, [Nome do Usuário])
    document.getElementById('dashboard-user-name').textContent = `Olá, ${currentUser.name}`;

    renderTodos();
    showScreen('dashboard');
};

// Efetua logout limpando os dados de sessão
const handleLogout = () => {
    currentUser = null;
    removeCurrentUser();
    showScreen('login');
};

// Adiciona uma nova tarefa ao banco simulado
const handleAddTodo = (e) => {
    e.preventDefault();
    
    // Limpar erros de input anteriores se houver
    const titleError = document.getElementById('todo-title-error');
    const titleInput = document.getElementById('todo-title');
    const typeInput = document.getElementById('todo-type');
    const descInput = document.getElementById('todo-description');

    titleError.classList.add('hidden');
    titleInput.classList.remove('border-red-500');

    const titleText = titleInput.value.trim();
    const typeText = typeInput.value;
    const descText = descInput.value.trim();

    // Validação obrigatória do título
    if (!titleText) {
        titleInput.classList.add('border-red-500');
        titleError.textContent = 'O título da tarefa é obrigatório.';
        titleError.classList.remove('hidden');
        return;
    }

    const todos = getTodos();
    const newTodo = {
        id: Date.now(), // id (timestamp) conforme solicitado
        userId: currentUser.email, // userId (e-mail do usuário logado) conforme solicitado
        title: titleText,
        type: typeText,
        description: descText,
        done: false // done inicia como false conforme solicitado
    };

    todos.push(newTodo);
    saveTodos(todos);

    // Resetar formulário de criação
    titleInput.value = '';
    typeInput.value = 'Trabalho';
    descInput.value = '';

    renderTodos();
};

// Conclui uma tarefa mudando o status done para true
window.completeTodo = (todoId) => {
    const todos = getTodos();
    const updatedTodos = todos.map(t => {
        if (t.id === todoId && t.userId === currentUser.email) {
            return { ...t, done: true };
        }
        return t;
    });
    saveTodos(updatedTodos);
    renderTodos();
};

// Exclui uma tarefa do banco simulado
window.deleteTodo = (todoId) => {
    const todos = getTodos();
    const filteredTodos = todos.filter(t => !(t.id === todoId && t.userId === currentUser.email));
    saveTodos(filteredTodos);
    renderTodos();
};

// Filtra, ordena e renderiza as tarefas na tela
const renderTodos = () => {
    const allTodos = getTodos();
    // Filtro por userId (que é o e-mail do usuário logado)
    const userTodos = allTodos.filter(t => t.userId === currentUser.email);
    
    // Ordenação: Tarefas pendentes primeiro, concluídas (done: true) vão para o final
    userTodos.sort((a, b) => {
        if (a.done !== b.done) {
            return a.done ? 1 : -1;
        }
        return b.id - a.id; // Mais recentes primeiro dentro de cada grupo
    });

    const todoListElement = document.getElementById('todo-list');
    const emptyStateElement = document.getElementById('todo-empty-state');
    
    todoListElement.innerHTML = '';
    
    // Atualiza contador
    document.getElementById('todo-counter').textContent = userTodos.length;

    if (userTodos.length === 0) {
        emptyStateElement.classList.remove('hidden');
        return;
    }

    emptyStateElement.classList.add('hidden');

    userTodos.forEach(todo => {
        const div = document.createElement('div');
        
        // Estilização do badge por tipo (Trabalho = azul, Pessoal = roxo, Estudos = verde)
        let badgeClass = '';
        if (todo.type === 'Trabalho') {
            badgeClass = 'bg-blue-950/60 text-blue-400 border border-blue-800/80';
        } else if (todo.type === 'Pessoal') {
            badgeClass = 'bg-purple-950/60 text-purple-400 border border-purple-800/80';
        } else if (todo.type === 'Estudos') {
            badgeClass = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80';
        }

        // Estilização do card dependendo do estado de conclusão (done)
        const cardStyle = todo.done 
            ? 'opacity-60 bg-slate-900/40 border-slate-900' 
            : 'bg-slate-900 border-slate-800 hover:border-slate-700';

        const titleStyle = todo.done 
            ? 'line-through text-slate-500 font-semibold' 
            : 'text-white font-bold';

        div.className = `p-4 border backdrop-blur-sm relative transition-all duration-300 rounded-none flex flex-col justify-between ${cardStyle}`;
        
        // Renderiza o corpo do card
        div.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <!-- Badge colorido do tipo da tarefa -->
                    <span class="text-[10px] font-mono px-2 py-0.5 tracking-wider uppercase ${badgeClass}">
                        ${todo.type}
                    </span>
                    
                    ${todo.done ? `
                        <span class="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 uppercase tracking-wider">
                            Concluído
                        </span>
                    ` : ''}
                </div>
                
                <!-- Título da tarefa -->
                <h3 class="text-base font-sans tracking-tight break-words ${titleStyle}">
                    ${escapeHTML(todo.title)}
                </h3>
                
                <!-- Descrição da tarefa (se existir) -->
                ${todo.description ? `
                    <p class="text-xs text-slate-400 font-mono mt-2 break-words whitespace-pre-line border-l border-slate-800 pl-3">
                        ${escapeHTML(todo.description)}
                    </p>
                ` : ''}
            </div>

            <!-- Área de ações do card -->
            <div class="flex justify-between items-center mt-4 pt-3 border-t border-slate-950">
                <button onclick="deleteTodo(${todo.id})" class="text-slate-500 hover:text-red-500 font-mono text-[10px] uppercase tracking-wider transition-colors focus:outline-none flex items-center space-x-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>Excluir</span>
                </button>

                ${!todo.done ? `
                    <button onclick="completeTodo(${todo.id})" class="bg-slate-800 hover:bg-brand-orange hover:text-white border border-slate-700 hover:border-brand-orange text-slate-300 font-mono text-[10px] font-bold py-1 px-3 uppercase tracking-wider transition-all duration-300 focus:outline-none rounded-none">
                        Concluir
                    </button>
                ` : ''}
            </div>
        `;

        todoListElement.appendChild(div);
    });
};

// ==========================================
// CONFIGURAÇÃO DOS EVENTOS E INICIALIZAÇÃO
// ==========================================

const setupEventListeners = () => {
    // Submissão do Login
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    
    // Submissão do Cadastro
    document.getElementById('form-register').addEventListener('submit', handleRegister);

    // Submissão da nova tarefa
    document.getElementById('form-add-todo').addEventListener('submit', handleAddTodo);

    // Botão de Logout
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Alternar para tela de Cadastro
    document.getElementById('btn-go-to-register').addEventListener('click', () => showScreen('register'));

    // Alternar para tela de Login
    document.getElementById('btn-go-to-login').addEventListener('click', () => showScreen('login'));

    // Limpar erros inline dinamicamente ao digitar ou interagir com os inputs
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('border-red-500');
            const errorSpan = document.getElementById(`${input.id}-error`);
            if (errorSpan) {
                errorSpan.classList.add('hidden');
                errorSpan.textContent = '';
            }
        });
    });
};

// Execução no carregamento da aplicação
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    setupEventListeners();

    // Verificação de sessão (Restauração automática)
    currentUser = getCurrentUser();
    if (currentUser) {
        loadDashboard();
    } else {
        showScreen('login');
    }
});
