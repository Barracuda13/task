// Глобальные переменные
let currentUser = null;
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentView = 'open';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setCurrentDate();
    checkAuth();
});

// Настройка обработчиков событий
function setupEventListeners() {
    document.getElementById('authForm').addEventListener('submit', handleLogin);
    document.getElementById('createTaskBtn').addEventListener('click', showTaskForm);
    document.getElementById('cancelTaskBtn').addEventListener('click', hideTaskForm);
    document.getElementById('newTaskForm').addEventListener('submit', handleNewTask);
    document.getElementById('openTasksBtn').addEventListener('click', () => switchView('open'));
    document.getElementById('closedTasksBtn').addEventListener('click', () => switchView('closed'));
    document.getElementById('searchInput').addEventListener('input', filterTasks);
    document.getElementById('filterSelect').addEventListener('change', filterTasks);
}

// Установка текущей даты
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('creationDate').value = today;
}

// Проверка авторизации
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainContent();
    }
}

// Обработка входа
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Здесь должна быть реальная проверка авторизации
    // Для демонстрации используем простую проверку
    if (username && password) {
        currentUser = { username };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainContent();
    }
}

// Показать основной контент
function showMainContent() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadTasks();
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
function handleNewTask(e) {
    e.preventDefault();
    
    const newTask = {
        id: Date.now(),
        creationDate: document.getElementById('creationDate').value,
        type: document.getElementById('taskType').value,
        priority: document.getElementById('priority').value,
        status: 'new',
        assignee: document.getElementById('assignee').value,
        dueDate: document.getElementById('dueDate').value,
        description: document.getElementById('description').value,
        notes: document.getElementById('notes').value,
        createdBy: currentUser.username
    };

    tasks.push(newTask);
    saveTasks();
    hideTaskForm();
    loadTasks();
}

// Сохранение задач
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Загрузка задач
function loadTasks() {
    const filteredTasks = tasks.filter(task => {
        if (currentView === 'open') {
            return task.status !== 'closed';
        } else {
            return task.status === 'closed';
        }
    });

    displayTasks(filteredTasks);
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

// Закрытие задачи
function closeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('task-closing');
            createConfetti(taskElement);
            
            setTimeout(() => {
                tasks[taskIndex].status = 'closed';
                saveTasks();
                loadTasks();
            }, 500);
        }
    }
} 