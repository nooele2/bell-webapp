from flask import Flask, request, jsonify, session, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
import psycopg2
import psycopg2.extras
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'Bell Schedule API',
        'status': 'running',
        'endpoints': {
            'bell': '/api/bell',
            'login': '/api/login',
            'schedules': '/api/schedules',
            'ringtone_mappings': '/api/ringtone-mappings',
            'public_ringtimes': '/public/ringtimes',
            'public_ringdates': '/public/ringdates'
        }
    })

# ============================================================================
# CORS Configuration
# ============================================================================
CORS(app,
     origins=[
         'http://localhost:5173',
         'http://localhost:3000',
         'https://bell-webapp.vercel.app'
     ],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     expose_headers=['Set-Cookie'])

# ============================================================================
# Session Configuration
# ============================================================================
is_production = os.environ.get('RENDER') is not None or os.environ.get('FLASK_ENV') == 'production'

app.config['SESSION_COOKIE_SECURE'] = is_production
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if is_production else 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = 1800
app.config['SESSION_COOKIE_DOMAIN'] = None
app.config['SESSION_COOKIE_PATH'] = '/'

print(f"🔧 Session config: SECURE={app.config['SESSION_COOKIE_SECURE']}, SAMESITE={app.config['SESSION_COOKIE_SAMESITE']}")

# Users
USERS = {
    'boo@crics.asia': {
        'password_hash': generate_password_hash('boo123'),
        'name': 'Boo'
    }
}

# Default color presets
DEFAULT_COLORS = {
    "Normal": {"name": "Yellow", "value": "#fef3c7", "border": "#fde047", "text": "#854d0e"},
    "Late Start": {"name": "Blue", "value": "#dbeafe", "border": "#60a5fa", "text": "#1e3a8a"},
    "Buddy": {"name": "Green", "value": "#d1fae5", "border": "#34d399", "text": "#065f46"},
    "Assembly": {"name": "Purple", "value": "#e9d5ff", "border": "#a78bfa", "text": "#5b21b6"}
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
    """Insert default schedule if none exist"""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as count FROM schedules")
        result = cur.fetchone()
        if result['count'] == 0:
            cur.execute("""
                INSERT INTO schedules (id, name, mode, is_default, is_system, color, bell_sound_id, times)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                "1", "Normal Schedule", "Normal", True, False,
                json.dumps(DEFAULT_COLORS["Normal"]), None,
                json.dumps([
                    {"time": "09:00", "description": "1st period"},
                    {"time": "10:00", "description": "2nd period"},
                    {"time": "10:30", "description": "Morning break"},
                    {"time": "11:00", "description": "3rd period"},
                    {"time": "12:00", "description": "Lunch break"},
                    {"time": "13:00", "description": "4th period"},
                    {"time": "14:00", "description": "5th period"},
                    {"time": "15:00", "description": "School end"}
                ])
            ))
            conn.commit()
            print("✅ Default schedule inserted")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB init error: {e}")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def row_to_schedule(row):
    return {
        'id': row['id'],
        'name': row['name'],
        'mode': row['mode'],
        'isDefault': row['is_default'],
        'isSystem': row['is_system'],
        'color': row['color'] if row['color'] else DEFAULT_COLORS.get(row['mode'], DEFAULT_COLORS["Normal"]),
        'bellSoundId': row['bell_sound_id'],
        'times': row['times'] if row['times'] else []
    }

def row_to_assignment(row):
    a = {
        'id': row['id'],
        'date': row['date'],
        'scheduleId': row['schedule_id'],
        'description': row['description'] or ''
    }
    if row.get('custom_times'):
        a['customTimes'] = row['custom_times']
    if row.get('bell_sound_id'):
        a['bellSoundId'] = row['bell_sound_id']
    return a

def get_ringtone_slot(filename, mappings):
    """Return the slot number (as string) for a filename, or space if not mapped."""
    if not filename:
        return ' '
    for slot, mapped_filename in mappings.items():
        if mapped_filename == filename:
            return str(slot)
    return ' '

# ============================================================================
# PUBLIC URL ENDPOINTS
# ============================================================================

@app.route('/public/ringtimes', methods=['GET'])
def public_ringtimes():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM schedules WHERE is_system = FALSE ORDER BY is_default DESC, name")
        schedules = [row_to_schedule(r) for r in cur.fetchall()]

        cur.execute("SELECT slot, filename FROM ringtone_mappings ORDER BY slot")
        mappings = {str(row['slot']): row['filename'] for row in cur.fetchall()}

        cur.close()
        conn.close()

        lines = []
        lines.append("# Bell Schedule - ringtimes file")
        lines.append("# Live from Bell Schedule Management System")
        lines.append(f"# Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("#")
        lines.append("# Format: HH:MMsR Description")
        lines.append("#   s = schedule code (space=Normal, A-Z=Special)")
        lines.append("#   R = ringtone slot (space=default, 0-9=slot number, -=mute)")
        lines.append("#")

        schedule_codes = {}
        normal_schedule = None
        special_schedules = []

        for schedule in schedules:
            if schedule.get('isDefault'):
                normal_schedule = schedule
            else:
                special_schedules.append(schedule)

        used_codes = set()
        all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for schedule in special_schedules:
            preferred = schedule['name'][0].upper() if schedule['name'] else 'A'
            if preferred in all_letters and preferred not in used_codes:
                schedule_codes[schedule['id']] = preferred
                used_codes.add(preferred)
            else:
                for letter in all_letters:
                    if letter not in used_codes:
                        schedule_codes[schedule['id']] = letter
                        used_codes.add(letter)
                        break

        if normal_schedule and normal_schedule.get('times'):
            r_digit = get_ringtone_slot(normal_schedule.get('bellSoundId'), mappings)
            lines.append("")
            lines.append(f"# Normal Schedule: {normal_schedule['name']}")
            for time_entry in normal_schedule['times']:
                time_str = time_entry['time']
                description = time_entry.get('description', '')
                lines.append(f"{time_str} {r_digit} {description}")

        for schedule in special_schedules:
            if not schedule.get('times'):
                continue
            schedule_code = schedule_codes.get(schedule['id'], 'X')
            r_digit = get_ringtone_slot(schedule.get('bellSoundId'), mappings)
            lines.append("")
            lines.append(f"# Special Schedule ({schedule_code}): {schedule['name']}")
            for time_entry in schedule['times']:
                time_str = time_entry['time']
                description = time_entry.get('description', '')
                lines.append(f"{time_str}{schedule_code}{r_digit} {description}")

        return Response('\n'.join(lines), mimetype='text/plain')

    except Exception as e:
        print(f"Error generating ringtimes: {e}")
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


@app.route('/public/ringdates', methods=['GET'])
def public_ringdates():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM schedules WHERE is_system = FALSE ORDER BY is_default DESC, name")
        schedules = [row_to_schedule(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM assignments ORDER BY date")
        assignments = [row_to_assignment(r) for r in cur.fetchall()]
        cur.close()
        conn.close()

        lines = []
        lines.append("# Bell Schedule - ringdates file")
        lines.append("# Live from Bell Schedule Management System")
        lines.append(f"# Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("#")
        lines.append("# Format: YYYY-MM-DDsP Description")
        lines.append("#")

        # Build schedule codes - only for special (non-default) schedules
        schedule_codes = {}
        special_schedules = []
        for schedule in schedules:
            if not schedule.get('isDefault'):
                special_schedules.append(schedule)

        used_codes = set()
        all_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for schedule in special_schedules:
            preferred = schedule['name'][0].upper() if schedule['name'] else 'A'
            if preferred in all_letters and preferred not in used_codes:
                schedule_codes[schedule['id']] = preferred
                used_codes.add(preferred)
            else:
                for letter in all_letters:
                    if letter not in used_codes:
                        schedule_codes[schedule['id']] = letter
                        used_codes.add(letter)
                        break

        for assignment in assignments:
            date_str = assignment['date']
            schedule_id = assignment['scheduleId']
            description = assignment.get('description', '')

            if schedule_id == 'system-no-bell':
                # No-Bells day: space at position 10
                lines.append(f"{date_str}   {description if description else 'No Bells'}")
            else:
                schedule_code = schedule_codes.get(schedule_id)
                if not schedule_code:
                    # This is the default/normal schedule - skip it, piring handles it automatically
                    continue
                lines.append(f"{date_str}{schedule_code}  {description}")

        return Response('\n'.join(lines), mimetype='text/plain')

    except Exception as e:
        print(f"Error generating ringdates: {e}")
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


# ============================================================================
# AUTHENTICATION
# ============================================================================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    user = USERS.get(email)
    if user and check_password_hash(user['password_hash'], password):
        session.permanent = True
        session['logged_in'] = True
        session['user'] = email
        session['name'] = user['name']
        print(f"✅ Login successful for {email}")
        return jsonify({'success': True, 'user': {'email': email, 'name': user['name']}})
    print(f"❌ Login failed for {email}")
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth', methods=['GET', 'OPTIONS'])
def check_auth():
    if request.method == 'OPTIONS':
        return '', 200
    print(f"🔍 Check auth - Session data: {dict(session)}")
    if 'logged_in' in session:
        return jsonify({'authenticated': True, 'user': {'email': session.get('user'), 'name': session.get('name')}})
    print("❌ Not authenticated - no session")
    return jsonify({'authenticated': False}), 401

# ============================================================================
# RINGTONE MAPPINGS API
# ============================================================================

@app.route('/api/ringtone-mappings', methods=['GET'])
@login_required
def get_ringtone_mappings():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT slot, filename FROM ringtone_mappings ORDER BY slot")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    mappings = {str(i): None for i in range(10)}
    for row in rows:
        mappings[str(row['slot'])] = row['filename']
    return jsonify(mappings)

@app.route('/api/ringtone-mappings', methods=['PUT'])
@login_required
def save_ringtone_mappings():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    for slot_str, filename in data.items():
        try:
            slot = int(slot_str)
            if slot < 0 or slot > 9:
                continue
            if filename:
                cur.execute("""
                    INSERT INTO ringtone_mappings (slot, filename)
                    VALUES (%s, %s)
                    ON CONFLICT (slot) DO UPDATE SET filename = EXCLUDED.filename
                """, (slot, filename))
            else:
                cur.execute("DELETE FROM ringtone_mappings WHERE slot = %s", (slot,))
        except (ValueError, TypeError):
            continue
    conn.commit()
    cur.close()
    conn.close()
    print("🔔 Ringtone mappings saved!")
    return jsonify({'success': True})

# ============================================================================
# SCHEDULES API
# ============================================================================

@app.route('/api/schedules', methods=['GET'])
@login_required
def get_schedules():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM schedules ORDER BY is_default DESC, name")
    schedules = [row_to_schedule(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
@login_required
def create_schedule():
    data = request.json
    if not data.get('name') or not data.get('mode'):
        return jsonify({'error': 'Name and mode are required'}), 400

    schedule_id = str(int(datetime.now().timestamp() * 1000))
    color = data.get('color') or DEFAULT_COLORS.get(data['mode'], DEFAULT_COLORS["Normal"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO schedules (id, name, mode, is_default, is_system, color, bell_sound_id, times)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING *
    """, (
        schedule_id, data['name'], data['mode'],
        data.get('isDefault', False), data.get('isSystem', False),
        json.dumps(color), data.get('bellSoundId'),
        json.dumps(data.get('times', []))
    ))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    print(f"🔔 Schedule created!")
    return jsonify(row_to_schedule(row)), 201

@app.route('/api/schedules/<schedule_id>', methods=['PUT'])
@login_required
def update_schedule(schedule_id):
    data = request.json
    color = data.get('color') or DEFAULT_COLORS.get(data.get('mode', 'Normal'), DEFAULT_COLORS["Normal"])

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE schedules SET name=%s, mode=%s, is_default=%s, is_system=%s,
        color=%s, bell_sound_id=%s, times=%s WHERE id=%s RETURNING *
    """, (
        data.get('name'), data.get('mode'),
        data.get('isDefault', False), data.get('isSystem', False),
        json.dumps(color), data.get('bellSoundId'),
        json.dumps(data.get('times', [])), schedule_id
    ))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return jsonify({'error': 'Schedule not found'}), 404
    print(f"🔔 Schedule updated!")
    return jsonify(row_to_schedule(row))

@app.route('/api/schedules/<schedule_id>', methods=['DELETE'])
@login_required
def delete_schedule(schedule_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM schedules WHERE id=%s", (schedule_id,))
    cur.execute("DELETE FROM assignments WHERE schedule_id=%s", (schedule_id,))
    conn.commit()
    cur.close()
    conn.close()
    print(f"🔔 Schedule deleted!")
    return jsonify({'success': True})

# ============================================================================
# ASSIGNMENTS API
# ============================================================================

@app.route('/api/assignments', methods=['GET'])
@login_required
def get_assignments():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM assignments ORDER BY date")
    assignments = [row_to_assignment(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return jsonify(assignments)

@app.route('/api/assignments', methods=['POST'])
@login_required
def create_assignment():
    data = request.json
    dates = data.get('dates', [])
    schedule_id = data.get('scheduleId')
    description = data.get('description', '')
    custom_times = data.get('customTimes')
    bell_sound_id = data.get('bellSoundId')

    if not dates or not schedule_id:
        return jsonify({'error': 'Dates and scheduleId are required'}), 400

    conn = get_db()
    cur = conn.cursor()
    created = []
    for i, date in enumerate(dates):
        assignment_id = str(int(datetime.now().timestamp() * 1000)) + str(i)
        cur.execute("""
            INSERT INTO assignments (id, date, schedule_id, description, custom_times, bell_sound_id)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING *
        """, (
            assignment_id, date, schedule_id, description,
            json.dumps(custom_times) if custom_times else None,
            bell_sound_id
        ))
        created.append(row_to_assignment(cur.fetchone()))
    conn.commit()
    cur.close()
    conn.close()
    print(f"🔔 Assignment created!")
    return jsonify({'success': True, 'assignments': created}), 201

@app.route('/api/assignments/<assignment_id>', methods=['PUT'])
@login_required
def update_assignment(assignment_id):
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE assignments SET date=%s, schedule_id=%s, description=%s,
        custom_times=%s, bell_sound_id=%s WHERE id=%s RETURNING *
    """, (
        data.get('date'), data.get('scheduleId'), data.get('description', ''),
        json.dumps(data['customTimes']) if data.get('customTimes') else None,
        data.get('bellSoundId'), assignment_id
    ))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return jsonify({'error': 'Assignment not found'}), 404
    print(f"🔔 Assignment updated!")
    return jsonify(row_to_assignment(row))

@app.route('/api/assignments/<assignment_id>', methods=['DELETE'])
@login_required
def delete_assignment(assignment_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM assignments WHERE id=%s", (assignment_id,))
    conn.commit()
    cur.close()
    conn.close()
    print(f"🔔 Assignment deleted!")
    return jsonify({'success': True})

# ============================================================================
# STATUS ENDPOINT
# ============================================================================

@app.route('/api/bell', methods=['GET'])
def bell():
    return jsonify({
        'status': 'ok',
        'message': 'Bell Schedule API is running',
        'session_config': {
            'secure': app.config['SESSION_COOKIE_SECURE'],
            'samesite': app.config['SESSION_COOKIE_SAMESITE'],
            'httponly': app.config['SESSION_COOKIE_HTTPONLY']
        },
        'public_urls': {
            'ringtimes': 'https://bell-web-app.onrender.com/public/ringtimes',
            'ringdates': 'https://bell-web-app.onrender.com/public/ringdates',
        }
    })

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))

    print()
    print("=" * 70)
    print("🔔 BELL SCHEDULE SYSTEM - Backend API Server")
    print("=" * 70)
    print()
    print("📍 PUBLIC URLs (for bash script to read):")
    print(f"   Ringtimes: https://bell-web-app.onrender.com/public/ringtimes")
    print(f"   Ringdates: https://bell-web-app.onrender.com/public/ringdates")
    print()
    print(f"🔧 Session Config:")
    print(f"   SECURE: {app.config['SESSION_COOKIE_SECURE']}")
    print(f"   SAMESITE: {app.config['SESSION_COOKIE_SAMESITE']}")
    print(f"   Production Mode: {is_production}")
    print()
    print(f"✅ Backend running on port: {port}")
    print("=" * 70)
    print()

    init_db()
    app.run(debug=False, host='0.0.0.0', port=port)