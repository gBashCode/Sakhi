import sqlite3
db = sqlite3.connect('sakhi.db')
rows = db.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print(rows)
users = []
if ('users',) in rows or ('user',) in rows:
    tbl = 'users' if ('users',) in rows else 'user'
    users = db.execute(f"SELECT phone, role FROM {tbl}").fetchall()
print('Users:', users)
