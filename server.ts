import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import multer from 'multer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const db = new Database('lab_monitor.db');
db.pragma('journal_mode = WAL');

// Initialize Database Tables
try {
  db.exec('ALTER TABLE software_requests ADD COLUMN downloadLink TEXT;');
} catch (e) {
  // Ignore if column already exists
}

db.exec(`
  CREATE TABLE IF NOT EXISTS software_requests (
    id TEXT PRIMARY KEY,
    facultyId TEXT,
    softwareName TEXT,
    version TEXT,
    purpose TEXT,
    targetComputers TEXT,
    status TEXT,
    installerUrl TEXT,
    installerName TEXT,
    downloadLink TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    qrCode TEXT UNIQUE,
    name TEXT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    idNumber TEXT,
    departmentOrCourse TEXT,
    contactInfo TEXT,
    email TEXT,
    imageUrl TEXT,
    isOJT BOOLEAN DEFAULT 0,
    faceRegistered BOOLEAN DEFAULT 0,
    position TEXT
  );

  CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    qrCode TEXT UNIQUE,
    name TEXT,
    type TEXT,
    capacity INTEGER,
    available BOOLEAN DEFAULT 1,
    location TEXT,
    description TEXT,
    amenities TEXT -- Stored as JSON string
  );

  CREATE TABLE IF NOT EXISTS equipment (
    id TEXT PRIMARY KEY,
    qrCode TEXT UNIQUE,
    name TEXT,
    type TEXT,
    status TEXT,
    condition TEXT,
    lab TEXT,
    brand TEXT,
    serialNumber TEXT,
    poNumber TEXT,
    systemUnitSerial TEXT,
    monitorSerial TEXT,
    peripheralsSerials TEXT -- Stored as JSON string
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    equipmentId TEXT,
    borrowerId TEXT,
    borrowerRole TEXT,
    checkoutTime TEXT,
    expectedReturnTime TEXT,
    returnTime TEXT,
    checkoutCondition TEXT,
    returnCondition TEXT,
    status TEXT,
    purpose TEXT,
    remarks TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    timestamp TEXT,
    type TEXT,
    status TEXT,
    method TEXT
  );

  CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id TEXT PRIMARY KEY,
    equipmentId TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    resolvedAt TEXT,
    userId TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    facilityId TEXT,
    userId TEXT,
    startTime TEXT,
    endTime TEXT,
    purpose TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS pm_logs (
    id TEXT PRIMARY KEY,
    date TEXT,
    lab TEXT,
    month TEXT,
    formDate TEXT,
    weeks TEXT, -- Stored as JSON string
    preparedBy TEXT,
    evaluatedBy TEXT,
    preparedByDesignation TEXT,
    evaluatedByDesignation TEXT,
    evaluationDate TEXT,
    additionalConcerns TEXT,
    tasks TEXT -- Stored as JSON string
  );

  CREATE TABLE IF NOT EXISTS attendance_schedule (
    id TEXT PRIMARY KEY,
    timeInStart TEXT,
    timeInDeadline TEXT,
    logoutStart TEXT,
    logoutEnd TEXT
  );
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    labName TEXT,
    adminEmail TEXT,
    logoUrl TEXT,
    overdueAlerts BOOLEAN,
    adminEscalation BOOLEAN
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    read BOOLEAN DEFAULT 0,
    createdAt TEXT,
    targetView TEXT
  );
`);

// Add targetView to notifications if missing (migration)
try {
  db.prepare('ALTER TABLE notifications ADD COLUMN targetView TEXT').run();
} catch (e: any) {
  // Ignore error if column already exists
}

// Seed Admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('Admin');
if (!adminExists) {
  db.prepare(`
    INSERT INTO users (id, qrCode, name, username, password, role, idNumber, departmentOrCourse, email, isOJT)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('u-admin', 'ADM-001', 'Master Admin', 'admin', 'password123', 'Admin', 'ADM-2024-01', 'Administration', 'admin@university.edu', 0);
}

// Seed Default Schedule
const scheduleExists = db.prepare('SELECT id FROM attendance_schedule').get();
if (!scheduleExists) {
  db.prepare(`
    INSERT INTO attendance_schedule (id, timeInStart, timeInDeadline, logoutStart, logoutEnd)
    VALUES (?, ?, ?, ?, ?)
  `).run('default', '07:30', '08:30', '16:00', '18:00');
}

// Seed Default Settings
const settingsExists = db.prepare('SELECT id FROM settings').get();
if (!settingsExists) {
  db.prepare(`
    INSERT INTO settings (id, labName, adminEmail, logoUrl, overdueAlerts, adminEscalation)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('default', 'CCIS Main Laboratory', 'admin@ccis.edu', 'https://storage.googleapis.com/ar-auth-artifacts.appspot.com/artifacts/a895c141-8fec-4fa1-8ca6-0b8108420b92/attachments/3a29db70-a3da-4767-873b-ebccff5d414a/ccis_logo.png', 1, 1);
}

// Seed Mock Data
const facilityCount = db.prepare('SELECT COUNT(*) as count FROM facilities').get() as any;
if (facilityCount.count === 0) {
  const fStmt = db.prepare(`INSERT INTO facilities (id, qrCode, name, type, capacity, available, location, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  fStmt.run('f1', 'FAC-L1', 'Computer Lab 1', 'Room', 30, 1, 'Floor 1', 'Primary computing facility');
  fStmt.run('f2', 'FAC-L2', 'Computer Lab 2', 'Room', 25, 1, 'Floor 2', 'Advanced student workstation lab');
  fStmt.run('f3', 'FAC-SIM', 'Simulation Room', 'Room', 10, 1, 'Floor 1', 'Specialized simulation area');

  const eStmt = db.prepare(`INSERT INTO equipment (id, qrCode, name, type, status, condition, lab, brand, serialNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  eStmt.run('eq1', 'EQ-001', 'Workstation 01', 'Desktop Set', 'Available', 'Good', 'Computer Lab 1', 'Dell', 'SN-W01');
  eStmt.run('eq2', 'EQ-002', 'Workstation 02', 'Desktop Set', 'Available', 'Good', 'Computer Lab 1', 'Dell', 'SN-W02');
  eStmt.run('eq3', 'EQ-003', 'Simulation Kit A', 'IoT Kit', 'Available', 'Good', 'Simulation Room', 'Generic', 'SN-SKA');
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '20gb' }));
  app.use(express.urlencoded({ limit: '20gb', extended: true }));

  const PORT = 3000;

  // --- API ROUTES ---

  // Users
  app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users.map((u: any) => ({ ...u, isOJT: !!u.isOJT, faceRegistered: !!u.faceRegistered })));
  });

  app.post('/api/users', (req, res) => {
    const user = req.body;
    const stmt = db.prepare(`
      INSERT INTO users (id, qrCode, name, username, password, role, idNumber, departmentOrCourse, contactInfo, email, imageUrl, isOJT, faceRegistered, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.qrCode, user.name, user.username, user.password, user.role, user.idNumber, user.departmentOrCourse, user.contactInfo, user.email, user.imageUrl, user.isOJT ? 1 : 0, user.faceRegistered ? 1 : 0, user.position);
    res.json({ success: true });
  });

  app.put('/api/users/:id', (req, res) => {
    const user = req.body;
    const stmt = db.prepare(`
      UPDATE users SET 
        qrCode = ?, name = ?, username = ?, password = ?, role = ?, idNumber = ?, 
        departmentOrCourse = ?, contactInfo = ?, email = ?, imageUrl = ?, 
        isOJT = ?, faceRegistered = ?, position = ?
      WHERE id = ?
    `);
    stmt.run(user.qrCode, user.name, user.username, user.password, user.role, user.idNumber, user.departmentOrCourse, user.contactInfo, user.email, user.imageUrl, user.isOJT ? 1 : 0, user.faceRegistered ? 1 : 0, user.position, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/users/:id', (req, res) => {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/auth/check-email', (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT id, name, role FROM users WHERE email = ?').get(email);
    if (user) {
      res.json({ exists: true, user });
    } else {
      res.json({ exists: false });
    }
  });

  // Facilities
  app.get('/api/facilities', (req, res) => {
    const facilities = db.prepare('SELECT * FROM facilities').all();
    res.json(facilities.map((f: any) => ({ 
      ...f, 
      available: !!f.available,
      amenities: JSON.parse(f.amenities || '[]')
    })));
  });

  app.post('/api/facilities', (req, res) => {
    const f = req.body;
    const stmt = db.prepare(`
      INSERT INTO facilities (id, qrCode, name, type, capacity, available, location, description, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(f.id, f.qrCode, f.name, f.type, f.capacity, f.available ? 1 : 0, f.location, f.description, JSON.stringify(f.amenities || []));
    res.json({ success: true });
  });

  app.put('/api/facilities/:id', (req, res) => {
    const f = req.body;
    const stmt = db.prepare(`
      UPDATE facilities SET 
        qrCode = ?, name = ?, type = ?, capacity = ?, available = ?, 
        location = ?, description = ?, amenities = ?
      WHERE id = ?
    `);
    stmt.run(f.qrCode, f.name, f.type, f.capacity, f.available ? 1 : 0, f.location, f.description, JSON.stringify(f.amenities || []), req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/facilities/:id', (req, res) => {
    db.prepare('DELETE FROM facilities WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Equipment
  app.get('/api/equipment', (req, res) => {
    const equipment = db.prepare('SELECT * FROM equipment').all();
    res.json(equipment.map((e: any) => ({
      ...e,
      peripheralsSerials: JSON.parse(e.peripheralsSerials || '{}')
    })));
  });

  app.post('/api/equipment', (req, res) => {
    const e = req.body;
    const stmt = db.prepare(`
      INSERT INTO equipment (id, qrCode, name, type, status, condition, lab, brand, serialNumber, poNumber, systemUnitSerial, monitorSerial, peripheralsSerials)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(e.id, e.qrCode, e.name, e.type, e.status, e.condition, e.lab, e.brand, e.serialNumber, e.poNumber, e.systemUnitSerial, e.monitorSerial, JSON.stringify(e.peripheralsSerials || {}));
    res.json({ success: true });
  });

  app.put('/api/equipment/:id', (req, res) => {
    const e = req.body;
    const stmt = db.prepare(`
      UPDATE equipment SET 
        qrCode = ?, name = ?, type = ?, status = ?, condition = ?, 
        lab = ?, brand = ?, serialNumber = ?, poNumber = ?, 
        systemUnitSerial = ?, monitorSerial = ?, peripheralsSerials = ?
      WHERE id = ?
    `);
    stmt.run(e.qrCode, e.name, e.type, e.status, e.condition, e.lab, e.brand, e.serialNumber, e.poNumber, e.systemUnitSerial, e.monitorSerial, JSON.stringify(e.peripheralsSerials || {}), req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/equipment/:id', (req, res) => {
    db.prepare('DELETE FROM equipment WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Transactions
  app.get('/api/transactions', (req, res) => {
    res.json(db.prepare('SELECT * FROM transactions').all());
  });

  app.post('/api/transactions', (req, res) => {
    const t = req.body;
    const stmt = db.prepare(`
      INSERT INTO transactions (id, equipmentId, borrowerId, borrowerRole, checkoutTime, expectedReturnTime, returnTime, checkoutCondition, returnCondition, status, purpose, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(t.id, t.equipmentId, t.borrowerId, t.borrowerRole, t.checkoutTime, t.expectedReturnTime, t.returnTime, t.checkoutCondition, t.returnCondition, t.status, t.purpose, t.remarks);
    res.json({ success: true });
  });

  app.put('/api/transactions/:id', (req, res) => {
    const t = req.body;
    const stmt = db.prepare(`
      UPDATE transactions SET 
        equipmentId = ?, borrowerId = ?, borrowerRole = ?, checkoutTime = ?, 
        expectedReturnTime = ?, returnTime = ?, checkoutCondition = ?, 
        returnCondition = ?, status = ?, purpose = ?, remarks = ?
      WHERE id = ?
    `);
    stmt.run(t.equipmentId, t.borrowerId, t.borrowerRole, t.checkoutTime, t.expectedReturnTime, t.returnTime, t.checkoutCondition, t.returnCondition, t.status, t.purpose, t.remarks, req.params.id);
    res.json({ success: true });
  });

  // Maintenance Tickets
  app.get('/api/maintenance-tickets', (req, res) => {
    res.json(db.prepare('SELECT * FROM maintenance_tickets').all());
  });

  app.post('/api/maintenance-tickets', (req, res) => {
    const t = req.body;
    const stmt = db.prepare(`
      INSERT INTO maintenance_tickets (id, equipmentId, title, description, priority, status, createdAt, updatedAt, resolvedAt, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(t.id, t.equipmentId, t.title, t.description, t.priority, t.status, t.createdAt, t.updatedAt, t.resolvedAt, t.userId);
    res.json({ success: true });
  });

  app.put('/api/maintenance-tickets/:id', (req, res) => {
    const t = req.body;
    const stmt = db.prepare(`
      UPDATE maintenance_tickets SET 
        equipmentId = ?, title = ?, description = ?, priority = ?, 
        status = ?, createdAt = ?, updatedAt = ?, resolvedAt = ?, userId = ?
      WHERE id = ?
    `);
    stmt.run(t.equipmentId, t.title, t.description, t.priority, t.status, t.createdAt, t.updatedAt, t.resolvedAt, t.userId, req.params.id);
    res.json({ success: true });
  });

  // Bookings
  app.get('/api/bookings', (req, res) => {
    res.json(db.prepare('SELECT * FROM bookings').all());
  });

  app.post('/api/bookings', (req, res) => {
    const b = req.body;
    const stmt = db.prepare(`
      INSERT INTO bookings (id, facilityId, userId, startTime, endTime, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(b.id, b.facilityId, b.userId, b.startTime, b.endTime, b.purpose, b.status);
    res.json({ success: true });
  });

  app.put('/api/bookings/:id', (req, res) => {
    const b = req.body;
    const stmt = db.prepare(`
      UPDATE bookings SET status = ?
      WHERE id = ?
    `);
    stmt.run(b.status, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/bookings/:id', (req, res) => {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // PM Logs
  app.get('/api/pm-logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM pm_logs').all();
    res.json(logs.map((l: any) => ({
      ...l,
      weeks: JSON.parse(l.weeks || '[]'),
      tasks: JSON.parse(l.tasks || '{}')
    })));
  });

  app.post('/api/pm-logs', (req, res) => {
    const l = req.body;
    const stmt = db.prepare(`
      INSERT INTO pm_logs (id, date, lab, month, formDate, weeks, preparedBy, evaluatedBy, preparedByDesignation, evaluatedByDesignation, evaluationDate, additionalConcerns, tasks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(l.id, l.date, l.lab, l.month, l.formDate, JSON.stringify(l.weeks || []), l.preparedBy, l.evaluatedBy, l.preparedByDesignation, l.evaluatedByDesignation, l.evaluationDate, l.additionalConcerns, JSON.stringify(l.tasks || {}));
    res.json({ success: true });
  });

  // System Management
  app.post('/api/system/clear-transactions', (req, res) => {
    try {
      db.prepare('DELETE FROM transactions').run();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/system/reset', (req, res) => {
    try {
      const tables = [
        'users', 'facilities', 'equipment', 'transactions', 
        'maintenance_tickets', 'bookings', 
        'pm_logs'
      ];
      db.transaction(() => {
        tables.forEach(table => {
          db.prepare(`DELETE FROM ${table}`).run();
        });
        
        // Seed default admin again
        db.prepare(`
          INSERT INTO users (id, qrCode, name, username, password, role, idNumber, departmentOrCourse, email, isOJT)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('u-admin', 'ADM-001', 'Master Admin', 'admin', 'password123', 'Admin', 'ADM-2024-01', 'Administration', 'admin@university.edu', 0);
      })();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Backup
  app.get('/api/backup/export', (req, res) => {
    try {
      const data = {
        users: db.prepare('SELECT * FROM users').all(),
        facilities: db.prepare('SELECT * FROM facilities').all(),
        equipment: db.prepare('SELECT * FROM equipment').all(),
        transactions: db.prepare('SELECT * FROM transactions').all(),
        maintenance_tickets: db.prepare('SELECT * FROM maintenance_tickets').all(),
        bookings: db.prepare('SELECT * FROM bookings').all(),
        pm_logs: db.prepare('SELECT * FROM pm_logs').all(),
        software_requests: db.prepare('SELECT * FROM software_requests').all(),
      };
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/backup/import', (req, res) => {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ success: false, error: 'No data provided' });

      const transaction = db.transaction(() => {
        // Clear existing data except maybe we want to keep it? No, import backup usually overrides
        const tables = [
          'users', 'facilities', 'equipment', 'transactions', 
          'maintenance_tickets', 'bookings', 
          'pm_logs'
        ];
        
        tables.forEach(table => {
          if (data[table] && Array.isArray(data[table])) {
            db.prepare(`DELETE FROM ${table}`).run();
            const rows = data[table];
            if (rows.length > 0) {
              const columns = Object.keys(rows[0]);
              const placeholders = columns.map(() => '?').join(', ');
              const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
              for (const row of rows) {
                stmt.run(columns.map(col => row[col]));
              }
            }
          }
        });
      });

      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Software Requests
  app.get('/api/software-requests', (req, res) => {
    res.json(db.prepare('SELECT * FROM software_requests').all());
  });

  app.post('/api/software-requests', upload.single('installer'), (req, res) => {
    const sr = req.body;
    const file = req.file;
    const stmt = db.prepare(`
      INSERT INTO software_requests (id, facultyId, softwareName, version, purpose, targetComputers, status, installerUrl, installerName, downloadLink, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const installerUrl = file ? `/uploads/${file.filename}` : null;
    const installerName = file ? file.originalname : null;

    stmt.run(sr.id, sr.facultyId, sr.softwareName, sr.version || null, sr.purpose, sr.targetComputers, sr.status, installerUrl, installerName, sr.downloadLink || null, sr.createdAt, sr.updatedAt);
    res.json({ success: true, data: { ...sr, installerUrl, installerName } });
  });

  app.put('/api/software-requests/:id/status', (req, res) => {
    const stmt = db.prepare('UPDATE software_requests SET status = ?, updatedAt = ? WHERE id = ?');
    stmt.run(req.body.status, new Date().toISOString(), req.params.id);
    res.json({ success: true });
  });

  // Attendance Logs
  app.get('/api/attendance-logs', (req, res) => {
    const logs = db.prepare('SELECT * FROM attendance_logs').all();
    res.json(logs.map((l: any) => ({
      ...l,
      date: l.timestamp ? new Date(l.timestamp).toLocaleDateString() : 'N/A'
    })));
  });

  app.post('/api/attendance-logs', (req, res) => {
    const l = req.body;
    const stmt = db.prepare(`
      INSERT INTO attendance_logs (id, userId, timestamp, type, status, method)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(l.id, l.userId, l.timestamp, l.type, l.status, l.method);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings WHERE id = ?').get('default');
    if (settings) {
      res.json({
        ...settings,
        overdueAlerts: !!settings.overdueAlerts,
        adminEscalation: !!settings.adminEscalation
      });
    } else {
      res.json(null);
    }
  });

  app.put('/api/settings', (req, res) => {
    const s = req.body;
    const stmt = db.prepare(`
      UPDATE settings SET 
        labName = ?, adminEmail = ?, logoUrl = ?, 
        overdueAlerts = ?, adminEscalation = ?
      WHERE id = ?
    `);
    stmt.run(s.labName, s.adminEmail, s.logoUrl, s.overdueAlerts ? 1 : 0, s.adminEscalation ? 1 : 0, 'default');
    res.json({ success: true });
  });

  app.post('/api/settings/logo', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const logoUrl = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE settings SET logoUrl = ? WHERE id = ?').run(logoUrl, 'default');
    res.json({ success: true, logoUrl });
  });

  // Notifications
  app.get('/api/notifications', (req, res) => {
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY createdAt DESC').all();
    res.json(notifications.map((n: any) => ({ ...n, read: !!n.read })));
  });

  app.post('/api/notifications', (req, res) => {
    const n = req.body;
    db.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, read, createdAt, targetView)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(n.id, n.userId, n.title, n.message, n.type, n.read ? 1 : 0, n.createdAt, n.targetView || null);
    res.json({ success: true });
  });

  app.put('/api/notifications/:id', (req, res) => {
    const { read } = req.body;
    db.prepare('UPDATE notifications SET read = ? WHERE id = ?').run(read ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.use('/uploads', express.static(uploadDir));

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
