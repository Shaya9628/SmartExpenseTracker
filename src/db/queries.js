import SQLite from 'react-native-sqlite-storage';

export const db = SQLite.openDatabase(
  {
    name: 'SmartExpenseTracker.db',
    location: 'default',
  },
  () => console.log('Database connected'),
  error => console.error('Database error', error)
);

const defaultCategories = [
  { name: 'Food', color: '#FF6B6B', icon: 'food' },
  { name: 'Shopping', color: '#4ECDC4', icon: 'shopping' },
  { name: 'Transport', color: '#45B7D1', icon: 'car' },
  { name: 'Bills', color: '#96CEB4', icon: 'file-document' },
  { name: 'Entertainment', color: '#FFEEAD', icon: 'movie' },
  { name: 'Health', color: '#D4A5A5', icon: 'hospital' },
  { name: 'Others', color: '#9B59B6', icon: 'dots-horizontal' },
];

const defaultBanks = [
  { name: 'Cash', balance: 0 },
  { name: 'Bank Account', balance: 0 },
];

export const getTransactions = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT t.*, c.name as category_name, c.color as category_color, b.name as bank_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         LEFT JOIN banks b ON t.bank_id = b.id
         ORDER BY date DESC`,
        [],
        (_, { rows }) => resolve(rows.raw()),
        (_, error) => reject(error)
      );
    });
  });
};

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    const createTables = [
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        bank_id INTEGER,
        category_id INTEGER,
        description TEXT,
        raw_sms TEXT,
        FOREIGN KEY (bank_id) REFERENCES banks (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS banks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        balance REAL DEFAULT 0,
        account_number TEXT UNIQUE,
        last_updated TEXT
      )`
    ];

    const migrations = [
      `SELECT COUNT(*) as count FROM pragma_table_info('banks') WHERE name='account_number'`,
      `ALTER TABLE banks ADD COLUMN account_number TEXT`,
      `SELECT COUNT(*) as count FROM pragma_table_info('banks') WHERE name='last_updated'`,
      `ALTER TABLE banks ADD COLUMN last_updated TEXT`
    ];

    db.transaction(
      tx => {
        // Create tables
        createTables.forEach(query => {
          tx.executeSql(query, [], () => {}, error => {
            console.error('Error creating table:', error);
          });
        });

        // Run migrations
        migrations.forEach((query, index) => {
          if (index % 2 === 0) {
            tx.executeSql(query, [], (_, { rows }) => {
              if (rows.item(0).count === 0) {
                tx.executeSql(migrations[index + 1], [], () => {}, error => {
                  console.error('Error running migration:', error);
                });
              }
            });
          }
        });

        // Insert default categories
        tx.executeSql(
          'SELECT COUNT(*) as count FROM categories',
          [],
          (_, { rows }) => {
            if (rows.item(0).count === 0) {
              defaultCategories.forEach(category => {
                tx.executeSql(
                  'INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)',
                  [category.name, category.color, category.icon],
                  () => {},
                  error => console.error('Error inserting category:', error)
                );
              });
            }
          }
        );

        // Insert default banks
        tx.executeSql(
          'SELECT COUNT(*) as count FROM banks',
          [],
          (_, { rows }) => {
            if (rows.item(0).count === 0) {
              defaultBanks.forEach(bank => {
                tx.executeSql(
                  'INSERT INTO banks (name, balance) VALUES (?, ?)',
                  [bank.name, bank.balance],
                  () => {},
                  error => console.error('Error inserting bank:', error)
                );
              });
            }
          }
        );
      },
      error => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        console.log('Database initialized successfully');
        resolve();
      }
    );
  });
};