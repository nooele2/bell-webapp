from flask import Flask, request, jsonify, session, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

CORS(app,
     origins=["http://192.168.5.25:3000", "http://localhost:3000", "http://localhost:5173", "https://bell-webapp.vercel.app"],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     expose_headers=['Set-Cookie'])

is_production = os.environ.get('RENDER') is not None or os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_SECURE'] = is_production
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if is_production else 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 1800
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['SESSION_COOKIE_PATH'] = '/'

print(f"🔧 Session: SECURE={app.config['SESSION_COOKIE_SECURE']}, SAMESITE={app.config['SESSION_COOKIE_SAMESITE']}")

USERS = {
    'boo@crics.asia': {
        'password_hash': generate_password_hash('boo123'),
        'name': 'Boo'
    }
}

# ============================================================================
# DATABASE
# ============================================================================

def get_db():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")
    conn = psycopg2.connect(database_url, cursor_factory=psycopg2.extras.RealDictCursor)
    return conn

def init_db():
    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                color TEXT NOT NULL DEFAULT '#1a3a6b',
                is_addon BOOLEAN DEFAULT FALSE,
                is_normal BOOLEAN DEFAULT FALSE,
                bell_slot INTEGER DEFAULT 0,
                times JSONB DEFAULT '[]'
            )
        """)
        cur.execute("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_normal BOOLEAN DEFAULT FALSE")
        cur.execute("ALTER TABLE schedules ADD COLUMN IF NOT EXISTS bell_slot INTEGER DEFAULT 0")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS table_rows (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                from_date TEXT NOT NULL,
                to_date TEXT,
                comment TEXT DEFAULT ''
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ringtone_mappings (
                slot INTEGER PRIMARY KEY,
                filename TEXT NOT NULL
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS school_years (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL UNIQUE,
                from_date TEXT NOT NULL,
                to_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)

        conn.commit()

        # Seed default school years if empty
        cur.execute("SELECT COUNT(*) as count FROM school_years")
        if cur.fetchone()['count'] == 0:
            default_years = [
                ("sy-2025-2026", "2025/2026", "2025-08-01", "2026-07-31"),
                ("sy-2024-2025", "2024/2025", "2024-08-01", "2025-07-31"),
                ("sy-2023-2024", "2023/2024", "2023-08-01", "2024-07-31"),
                ("sy-2022-2023", "2022/2023", "2022-08-01", "2023-07-31"),
                ("sy-2021-2022", "2021/2022", "2021-08-01", "2022-07-31"),
                ("sy-2020-2021", "2020/2021", "2020-08-01", "2021-07-31"),
                ("sy-2019-2020", "2019/2020", "2019-08-01", "2020-07-31"),
            ]
            for sid, label, from_d, to_d in default_years:
                cur.execute("""
                    INSERT INTO school_years (id, label, from_date, to_date)
                    VALUES (%s, %s, %s, %s) ON CONFLICT (label) DO NOTHING
                """, (sid, label, from_d, to_d))
            conn.commit()
            print("✅ Default school years seeded")

        # Seed Normal schedule if empty
        cur.execute("SELECT COUNT(*) as count FROM schedules WHERE is_normal = TRUE")
        if cur.fetchone()['count'] == 0:
            cur.execute("""
                INSERT INTO schedules (id, code, name, color, is_addon, is_normal, times)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (code) DO NOTHING
            """, (
                "normal-schedule", "N", "Normal Schedule", "#1a3a6b", False, True,
                json.dumps([
                    {"time": "07:55", "label": "Pre-1st period",    "muted": False},
                    {"time": "08:00", "label": "1st period",         "muted": False},
                    {"time": "08:50", "label": "Pre-2nd period",     "muted": False},
                    {"time": "08:55", "label": "2nd period",         "muted": False},
                    {"time": "09:45", "label": "Morning break",      "muted": False},
                    {"time": "09:50", "label": "Pre-3rd period",     "muted": False},
                    {"time": "09:55", "label": "3rd period",         "muted": False},
                    {"time": "10:00", "label": "Elementary restart", "muted": False},
                    {"time": "10:45", "label": "Pre-4th period",     "muted": False},
                    {"time": "10:50", "label": "4th period",         "muted": False},
                    {"time": "11:40", "label": "Lunch break",        "muted": False},
                    {"time": "12:20", "label": "Pre-5th period",     "muted": False},
                    {"time": "12:25", "label": "5th period",         "muted": False},
                    {"time": "13:15", "label": "Pre-6th period",     "muted": False},
                    {"time": "13:20", "label": "6th period",         "muted": False},
                    {"time": "14:10", "label": "Pre-7th period",     "muted": False},
                    {"time": "14:15", "label": "7th period",         "muted": False},
                    {"time": "14:55", "label": "Pre-8th period",     "muted": False},
                    {"time": "15:00", "label": "8th period",         "muted": False},
                    {"time": "15:40", "label": "School end",         "muted": False},
                ])
            ))
            conn.commit()
            print("✅ Normal Schedule seeded")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB init error: {e}")

# ============================================================================
# HELPERS
# ============================================================================

def row_to_schedule(row):
    return {
        'id':       row['id'],
        'code':     row['code'],
        'name':     row['name'],
        'color':    row['color'],
        'isAddon':  row['is_addon'],
        'isNormal': row['is_normal'],
        'bellSlot': row['bell_slot'] if row['bell_slot'] is not None else 0,
        'times':    row['times'] if row['times'] else [],
    }

def row_to_table_row(row):
    return {
        'id':      row['id'],
        'code':    row['code'],
        'from':    row['from_date'],
        'to':      row['to_date'] or '',
        'comment': row['comment'] or '',
    }

def row_to_school_year(row):
    return {
        'id':    row['id'],
        'label': row['label'],
        'from':  row['from_date'],
        'to':    row['to_date'],
    }

# ============================================================================
# AUTH
# ============================================================================

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS': return '', 200
    data  = request.get_json()
    email = data.get('email', '').strip().lower()
    pwd   = data.get('password', '')
    user  = USERS.get(email)
    if user and check_password_hash(user['password_hash'], pwd):
        session.permanent = True
        session['logged_in'] = True
        session['user']      = email
        session['name']      = user['name']
        return jsonify({'success': True, 'user': {'email': email, 'name': user['name']}})
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS': return '', 200
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth', methods=['GET', 'OPTIONS'])
def check_auth():
    if request.method == 'OPTIONS': return '', 200
    if 'logged_in' in session:
        return jsonify({'authenticated': True, 'user': {'email': session.get('user'), 'name': session.get('name')}})
    return jsonify({'authenticated': False}), 401

# ============================================================================
# SCHOOL YEARS API
# ============================================================================

@app.route('/api/school-years', methods=['GET'])
@login_required
def get_school_years():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM school_years ORDER BY from_date DESC")
    years = [row_to_school_year(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return jsonify(years)

@app.route('/api/school-years', methods=['POST'])
@login_required
def create_school_year():
    data = request.json
    if not data.get('label') or not data.get('from') or not data.get('to'):
        return jsonify({'error': 'label, from, and to are required'}), 400
    sid = 'sy-' + str(int(datetime.now().timestamp() * 1000))
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO school_years (id, label, from_date, to_date)
            VALUES (%s, %s, %s, %s) RETURNING *
        """, (sid, data['label'], data['from'], data['to']))
        row = cur.fetchone(); conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({'error': f"Year '{data['label']}' already exists"}), 409
    cur.close(); conn.close()
    return jsonify(row_to_school_year(row)), 201

@app.route('/api/school-years/<sid>', methods=['DELETE'])
@login_required
def delete_school_year(sid):
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM school_years WHERE id=%s", (sid,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'success': True})

# ============================================================================
# SCHEDULES API
# ============================================================================

@app.route('/api/schedules', methods=['GET'])
@login_required
def get_schedules():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM schedules ORDER BY is_normal DESC, code")
    schedules = [row_to_schedule(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
@login_required
def create_schedule():
    data = request.json
    if not data.get('code') or not data.get('name'):
        return jsonify({'error': 'code and name are required'}), 400
    sid = str(int(datetime.now().timestamp() * 1000))
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO schedules (id, code, name, color, is_addon, is_normal, bell_slot, times)
            VALUES (%s, %s, %s, %s, %s, FALSE, %s, %s) RETURNING *
        """, (sid, data['code'], data['name'],
              data.get('color', '#2a5298'),
              data.get('isAddon', False),
              data.get('bellSlot', 0),
              json.dumps(data.get('times', []))))
        row = cur.fetchone(); conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback(); cur.close(); conn.close()
        return jsonify({'error': f"Code '{data['code']}' already exists"}), 409
    cur.close(); conn.close()
    return jsonify(row_to_schedule(row)), 201

@app.route('/api/schedules/<sid>', methods=['PUT'])
@login_required
def update_schedule(sid):
    data = request.json
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        UPDATE schedules
        SET code=%s, name=%s, color=%s, is_addon=%s, bell_slot=%s, times=%s
        WHERE id=%s RETURNING *
    """, (data.get('code'), data.get('name'),
          data.get('color', '#2a5298'),
          data.get('isAddon', False),
          data.get('bellSlot', 0),
          json.dumps(data.get('times', [])),
          sid))
    row = cur.fetchone(); conn.commit(); cur.close(); conn.close()
    if not row: return jsonify({'error': 'Not found'}), 404
    return jsonify(row_to_schedule(row))

@app.route('/api/schedules/<sid>', methods=['DELETE'])
@login_required
def delete_schedule(sid):
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT is_normal FROM schedules WHERE id=%s", (sid,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return jsonify({'error': 'Not found'}), 404
    if row['is_normal']:
        cur.close(); conn.close()
        return jsonify({'error': 'Cannot delete the Normal schedule'}), 403
    cur.execute("DELETE FROM schedules WHERE id=%s", (sid,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'success': True})

# ============================================================================
# TABLE ROWS API
# ============================================================================

@app.route('/api/table-rows', methods=['GET'])
@login_required
def get_table_rows():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT * FROM table_rows ORDER BY from_date, code")
    rows = [row_to_table_row(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return jsonify(rows)

@app.route('/api/table-rows', methods=['POST'])
@login_required
def create_table_row():
    data = request.json
    if not data.get('code') or not data.get('from'):
        return jsonify({'error': 'code and from are required'}), 400
    rid = str(int(datetime.now().timestamp() * 1000))
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        INSERT INTO table_rows (id, code, from_date, to_date, comment)
        VALUES (%s, %s, %s, %s, %s) RETURNING *
    """, (rid, data['code'], data['from'], data.get('to') or None, data.get('comment', '')))
    row = cur.fetchone(); conn.commit(); cur.close(); conn.close()
    return jsonify(row_to_table_row(row)), 201

@app.route('/api/table-rows/date/<date_str>', methods=['PUT'])
@login_required
def replace_date_rows(date_str):
    data = request.json
    conn = get_db(); cur = conn.cursor()
    cur.execute(
        "DELETE FROM table_rows WHERE from_date=%s AND (to_date IS NULL OR to_date='')",
        (date_str,)
    )
    created = []
    for i, item in enumerate(data):
        rid = str(int(datetime.now().timestamp() * 1000)) + str(i)
        cur.execute("""
            INSERT INTO table_rows (id, code, from_date, to_date, comment)
            VALUES (%s, %s, %s, NULL, %s) RETURNING *
        """, (rid, item['code'], date_str, item.get('comment', '')))
        created.append(row_to_table_row(cur.fetchone()))
    conn.commit(); cur.close(); conn.close()
    return jsonify(created)

@app.route('/api/table-rows/<rid>', methods=['PUT'])
@login_required
def update_table_row(rid):
    data = request.json
    conn = get_db(); cur = conn.cursor()
    cur.execute("""
        UPDATE table_rows SET code=%s, from_date=%s, to_date=%s, comment=%s
        WHERE id=%s RETURNING *
    """, (data.get('code'), data.get('from'), data.get('to') or None, data.get('comment', ''), rid))
    row = cur.fetchone(); conn.commit(); cur.close(); conn.close()
    if not row: return jsonify({'error': 'Not found'}), 404
    return jsonify(row_to_table_row(row))

@app.route('/api/table-rows/<rid>', methods=['DELETE'])
@login_required
def delete_table_row(rid):
    conn = get_db(); cur = conn.cursor()
    cur.execute("DELETE FROM table_rows WHERE id=%s", (rid,))
    conn.commit(); cur.close(); conn.close()
    return jsonify({'success': True})

# ============================================================================
# RINGTONE MAPPINGS API
# ============================================================================

@app.route('/api/ringtone-mappings', methods=['GET'])
@login_required
def get_ringtone_mappings():
    conn = get_db(); cur = conn.cursor()
    cur.execute("SELECT slot, filename FROM ringtone_mappings ORDER BY slot")
    rows = cur.fetchall(); cur.close(); conn.close()
    mappings = {str(i): None for i in range(10)}
    for row in rows:
        mappings[str(row['slot'])] = row['filename']
    return jsonify(mappings)

@app.route('/api/ringtone-mappings', methods=['PUT'])
@login_required
def save_ringtone_mappings():
    data = request.json
    conn = get_db(); cur = conn.cursor()
    for slot_str, filename in data.items():
        try:
            slot = int(slot_str)
            if not (0 <= slot <= 9): continue
            if filename:
                cur.execute("""
                    INSERT INTO ringtone_mappings (slot, filename) VALUES (%s, %s)
                    ON CONFLICT (slot) DO UPDATE SET filename = EXCLUDED.filename
                """, (slot, filename))
            else:
                cur.execute("DELETE FROM ringtone_mappings WHERE slot=%s", (slot,))
        except (ValueError, TypeError):
            continue
    conn.commit(); cur.close(); conn.close()
    return jsonify({'success': True})

# ============================================================================
# PUBLIC ENDPOINTS
# ============================================================================

@app.route('/public/ringtimes', methods=['GET'])
def public_ringtimes():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("SELECT * FROM schedules ORDER BY is_normal DESC, code")
        schedules = cur.fetchall()
        cur.execute("SELECT slot, filename FROM ringtone_mappings ORDER BY slot")
        mappings = {str(r['slot']): r['filename'] for r in cur.fetchall()}
        cur.close(); conn.close()

        normal  = next((s for s in schedules if s['is_normal']), None)
        special = [s for s in schedules if not s['is_normal']]

        lines = [
            "# Bell Schedule - ringtimes",
            f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "#",
        ]

        if normal and normal['times']:
            slot = str(normal['bell_slot']) if normal['bell_slot'] is not None else '0'
            lines.append(f"# Normal Schedule: {normal['name']}")
            for t in normal['times']:
                r = '-' if t.get('muted') else slot
                lines.append(f"{t['time']} {r} {t['label']}")

        for sch in special:
            if not sch['times']: continue
            sch_char = sch['code'][0]
            slot = str(sch['bell_slot']) if sch['bell_slot'] is not None else '0'
            lines.append("")
            lines.append(f"# {sch['name']} ({sch['code']})")
            for t in sch['times']:
                r = '-' if t.get('muted') else slot
                lines.append(f"{t['time']}{sch_char}{r} {t['label']}")

        return Response('\n'.join(lines), mimetype='text/plain')
    except Exception as e:
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


@app.route('/public/ringdates', methods=['GET'])
def public_ringdates():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("SELECT code, is_addon FROM schedules")
        sch_map = {r['code']: r['is_addon'] for r in cur.fetchall()}
        cur.execute("SELECT * FROM table_rows ORDER BY from_date, code")
        rows = cur.fetchall()
        cur.close(); conn.close()

        lines = [
            "# Bell Schedule - ringdates",
            f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "#",
        ]

        for row in rows:
            code     = row['code']
            from_d   = row['from_date']
            to_d     = row['to_date'] or ''
            comment  = row['comment'] or ''
            is_addon = sch_map.get(code, False)
            sch_char = code[0]
            suffix   = '+' if is_addon else ''

            if to_d and to_d != from_d:
                lines.append(f"{from_d}/{to_d}{sch_char}{suffix}  {comment}")
            else:
                lines.append(f"{from_d}{sch_char}{suffix}  {comment}")

        return Response('\n'.join(lines), mimetype='text/plain')
    except Exception as e:
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Bell Schedule API', 'status': 'running'})

@app.route('/api/bell', methods=['GET'])
def bell():
    return jsonify({'status': 'ok'})

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("=" * 60)
    print("BELL SCHEDULE SYSTEM")
    print("=" * 60)
    init_db()
    app.run(debug=False, host='0.0.0.0', port=port)