// Глобальные переменные
let currentUser = null;
let tasks = [];
let users = [];
let currentView = 'open';
const API_URL = 'http://localhost:3000/api';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setCurrentDate();
    checkAuth();
});

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('createTaskBtn').addEventListener('click', showTaskForm);
    document.getElementById('cancelTaskBtn').addEventListener('click', hideTaskForm);
    document.getElementById('newTaskForm').addEventListener('submit', handleNewTask);
    document.getElementById('openTasksBtn').addEventListener('click', () => switchView('open'));
    document.getElementById('closedTasksBtn').addEventListener('click', () => switchView('closed'));
    document.getElementById('searchInput').addEventListener('input', filterTasks);
    document.getElementById('filterSelect').addEventListener('change', filterTasks);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

// Установка текущей даты
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('creationDate').value = today;
}

// Проверка авторизации
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                currentUser = JSON.parse(localStorage.getItem('currentUser'));
                await loadUsers();
                showMainContent();
                await loadTasks();
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            handleLogout();
        }
    }
}

// Загрузка списка пользователей
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            users = await response.json();
            updateAssigneeSelect();
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

// Обновление списка исполнителей
function updateAssigneeSelect() {
    const select = document.getElementById('assignee');
    select.innerHTML = '<option value="">Выберите исполнителя</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.username;
        option.textContent = user.username;
        select.appendChild(option);
    });
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            await loadUsers();
            showMainContent();
            await loadTasks();
        } else {
            alert('Ошибка входа. Проверьте учетные данные.');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Ошибка при попытке входа');
    }
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Регистрация успешна. Теперь вы можете войти.');
            document.getElementById('registerForm').reset();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка при регистрации');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        alert('Ошибка при попытке регистрации');
    }
}

// Показать основной контент
function showMainContent() {
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// Показать форму создания задачи
function showTaskForm() {
    document.getElementById('taskForm').style.display = 'block';
    document.getElementById('tasksList').style.display = 'none';
}

// Скрыть форму создания задачи
function hideTaskForm() {
    document.getElementById('taskForm').style.display = 'none';
    document.getElementById('tasksList').style.display = 'block';
    document.getElementById('newTaskForm').reset();
}

// Обработка создания новой задачи
async function handleNewTask(e) {
    e.preventDefault();
    
    const newTask = {
        creationDate: document.getElementById('creationDate').value,
        type: document.getElementById('taskType').value,
        priority: document.getElementById('priority').value,
        status: 'new',
        assignee: document.getElementById('assignee').value,
        dueDate: document.getElementById('dueDate').value,
        description: document.getElementById('description').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(newTask)
        });

        if (response.ok) {
            hideTaskForm();
            await loadTasks();
        } else {
            alert('Ошибка при создании задачи');
        }
    } catch (error) {
        console.error('Ошибка создания задачи:', error);
        alert('Ошибка при создании задачи');
    }
}

// Загрузка задач
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            tasks = await response.json();
            const filteredTasks = tasks.filter(task => {
                if (currentView === 'open') {
                    return task.status !== 'closed';
                } else {
                    return task.status === 'closed';
                }
            });
            displayTasks(filteredTasks);
        }
    } catch (error) {
        console.error('Ошибка загрузки задач:', error);
    }
}

// Отображение задач
function displayTasks(tasksToShow) {
    const container = document.getElementById('tasksContainer');
    container.innerHTML = '';

    tasksToShow.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
    });
}

// Создание элемента задачи
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.setAttribute('data-task-id', task.id);
    
    const priorityClass = `priority-${task.priority}`;
    
    div.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${task.type}</h3>
            <span class="task-status ${task.status === 'closed' ? 'status-closed' : 'status-open'}">
                ${task.status === 'closed' ? 'Закрыта' : 'Открыта'}
            </span>
        </div>
        <div class="task-meta">
            <span class="${priorityClass}">Приоритет: ${task.priority}</span>
            <span> | Исполнитель: ${task.assignee}</span>
            <span> | Срок: ${task.dueDate}</span>
        </div>
        <div class="task-description">${task.description}</div>
        ${task.notes ? `<div class="task-notes">Примечание: ${task.notes}</div>` : ''}
        <div class="task-footer">
            <span>Создано: ${task.creationDate}</span>
            ${task.status !== 'closed' ? 
                `<button class="btn btn-sm btn-success" onclick="closeTask(${task.id})">Закрыть</button>` : 
                ''}
        </div>
    `;
    
    return div;
}

// Переключение вида (открытые/закрытые)
function switchView(view) {
    currentView = view;
    document.getElementById('openTasksBtn').classList.toggle('active', view === 'open');
    document.getElementById('closedTasksBtn').classList.toggle('active', view === 'closed');
    loadTasks();
}

// Фильтрация задач
function filterTasks() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('filterSelect').value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.description.toLowerCase().includes(searchText) ||
                            task.assignee.toLowerCase().includes(searchText);
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        const matchesStatus = currentView === 'open' ? task.status !== 'closed' : task.status === 'closed';

        return matchesSearch && matchesPriority && matchesStatus;
    });

    displayTasks(filteredTasks);
}

// Закрытие задачи
async function closeTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'closed' })
        });

        if (response.ok) {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
                taskElement.classList.add('task-closing');
                createConfetti(taskElement);
                
                setTimeout(async () => {
                    await loadTasks();
                }, 500);
            }
        } else {
            alert('Ошибка при закрытии задачи');
        }
    } catch (error) {
        console.error('Ошибка закрытия задачи:', error);
        alert('Ошибка при закрытии задачи');
    }
}

// Обработка выхода
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    tasks = [];
    users = [];
    
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('authForms').style.display = 'block';
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

// Создание конфетти
function createConfetti(element) {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = Math.random() * 100 + '%';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        element.appendChild(confetti);
    }
} 