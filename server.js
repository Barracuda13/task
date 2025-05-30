const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // В продакшене использовать безопасный ключ

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Временное хранилище данных (в реальном приложении использовать базу данных)
let users = [
    {
        id: 1,
        username: 'admin',
        password: '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5YxX', // 'admin123'
        role: 'admin'
    }
];
let tasks = [];

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: users.length + 1,
        username,
        password: hashedPassword,
        role: 'user'
    };

    users.push(newUser);
    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
});

// Авторизация
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// Получение списка пользователей
app.get('/api/users', authenticateToken, (req, res) => {
    const userList = users.map(({ id, username, role }) => ({ id, username, role }));
    res.json(userList);
});

// Получение всех задач
app.get('/api/tasks', authenticateToken, (req, res) => {
    res.json(tasks);
});

// Создание новой задачи
app.post('/api/tasks', authenticateToken, (req, res) => {
    const newTask = {
        id: Date.now(),
        ...req.body,
        createdBy: req.user.username,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Обновление задачи
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Задача не найдена' });
    }

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    res.json(tasks[taskIndex]);
});

// Удаление задачи
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Задача не найдена' });
    }

    tasks.splice(taskIndex, 1);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 