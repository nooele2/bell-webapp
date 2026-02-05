from flask import Flask, request, jsonify, session, send_file, Response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
from datetime import datetime
from io import BytesIO

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')

# CORS Configuration
CORS(app, 
     origins=['http://localhost:5173', 'http://localhost:3000'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCHEDULES_FILE = os.path.join(DATA_DIR, 'schedules.json')
ASSIGNMENTS_FILE = os.path.join(DATA_DIR, 'assignments.json')

# Create directories
os.makedirs(DATA_DIR, exist_ok=True)

# Users
USERS = {
    'boo@crics.asia': {
        'password_hash': generate_password_hash('boo123'),
        'name': 'Boo'
    }
}

# Session config
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = 1800
app.config['SESSION_COOKIE_DOMAIN'] = None

# Default color presets
DEFAULT_COLORS = {
    "Normal": {"name": "Yellow", "value": "#fef3c7", "border": "#fde047", "text": "#854d0e"},
    "Late Start": {"name": "Blue", "value": "#dbeafe", "border": "#60a5fa", "text": "#1e3a8a"},
    "Buddy": {"name": "Green", "value": "#d1fae5", "border": "#34d399", "text": "#065f46"},
    "Assembly": {"name": "Purple", "value": "#e9d5ff", "border": "#a78bfa", "text": "#5b21b6"}
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def load_schedules():
    try:
        with open(SCHEDULES_FILE, 'r') as f:
            schedules = json.load(f)
            
        for schedule in schedules:
            if 'color' not in schedule:
                mode = schedule.get('mode', 'Normal')
                schedule['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
            
            if 'bellSoundId' not in schedule:
                schedule['bellSoundId'] = None
        
        return schedules
    except:
        return []

def save_schedules(schedules):
    try:
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving schedules: {e}")
        return False

def load_assignments():
    try:
        with open(ASSIGNMENTS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_assignments(assignments):
    try:
        with open(ASSIGNMENTS_FILE, 'w') as f:
            json.dump(assignments, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving assignments: {e}")
        return False

# ============================================================================
# PUBLIC URL ENDPOINTS - FOR BASH SCRIPT TO READ
# These endpoints are accessible without authentication
# Similar to how Google Sheets links work
# ============================================================================

@app.route('/public/ringtimes', methods=['GET'])
def public_ringtimes():
    """
    PUBLIC ENDPOINT - Bash script reads from here
    URL: http://your-server:5001/public/ringtimes
    
    Returns ringtimes in piring format (plain text)
    Always up-to-date with latest schedules
    """
    try:
        schedules = load_schedules()
        
        lines = []
        lines.append("# Bell Schedule - ringtimes file")
        lines.append("# Live from Bell Schedule Management System")
        lines.append(f"# Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("#")
        lines.append("# Format: HH:MMsR Description")
        lines.append("# s = Schedule code (space for Normal, letter for Special)")
        lines.append("# R = Ringtone code (0-9, or - for muted)")
        lines.append("#")
        
        # Generate schedule codes
        schedule_codes = {}
        normal_schedule = None
        special_schedules = []
        
        for schedule in schedules:
            if schedule.get('isSystem'):
                continue
            
            if schedule.get('isDefault'):
                normal_schedule = schedule
                schedule_codes[schedule['id']] = ' '
            else:
                special_schedules.append(schedule)
        
        # Assign letter codes to special schedules
        code_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for i, schedule in enumerate(special_schedules):
            if i < len(code_letters):
                schedule_codes[schedule['id']] = code_letters[i]
        
        # Export Normal schedule first
        if normal_schedule and normal_schedule.get('times'):
            lines.append("")
            lines.append(f"# Normal Schedule: {normal_schedule['name']}")
            for i, time_entry in enumerate(normal_schedule['times']):
                time_str = time_entry['time']
                description = time_entry.get('description', '')
                
                if i == 0:
                    lines.append(f"{time_str} 0 {description}")
                else:
                    lines.append(f"{time_str}   {description}")
        
        # Export Special schedules
        for schedule in special_schedules:
            if not schedule.get('times'):
                continue
                
            schedule_code = schedule_codes.get(schedule['id'], 'X')
            lines.append("")
            lines.append(f"# Special Schedule ({schedule_code}): {schedule['name']}")
            
            for i, time_entry in enumerate(schedule['times']):
                time_str = time_entry['time']
                description = time_entry.get('description', '')
                
                if i == 0:
                    lines.append(f"{time_str} {schedule_code}0 {description}")
                else:
                    lines.append(f"{time_str}   {description}")
        
        content = '\n'.join(lines)
        
        # Return as plain text (like reading from a URL)
        return Response(content, mimetype='text/plain')
        
    except Exception as e:
        print(f"Error generating ringtimes: {e}")
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


@app.route('/public/ringdates', methods=['GET'])
def public_ringdates():
    """
    PUBLIC ENDPOINT - Bash script reads from here
    URL: http://your-server:5001/public/ringdates
    
    Returns ringdates in piring format (plain text)
    Always up-to-date with latest date assignments
    """
    try:
        schedules = load_schedules()
        assignments = load_assignments()
        
        lines = []
        lines.append("# Bell Schedule - ringdates file")
        lines.append("# Live from Bell Schedule Management System")
        lines.append(f"# Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("#")
        lines.append("# Format: YYYY-MM-DDsP Description")
        lines.append("# s = Schedule code (space for No-Bells, letter for Special)")
        lines.append("# P = + for Additional schedule (keeps Normal schedule)")
        lines.append("#")
        
        # Generate schedule codes (same as ringtimes)
        schedule_codes = {}
        normal_schedule = None
        special_schedules = []
        
        for schedule in schedules:
            if schedule.get('isSystem'):
                continue
            
            if schedule.get('isDefault'):
                normal_schedule = schedule
                schedule_codes[schedule['id']] = ' '
            else:
                special_schedules.append(schedule)
        
        # Assign letter codes
        code_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        for i, schedule in enumerate(special_schedules):
            if i < len(code_letters):
                schedule_codes[schedule['id']] = code_letters[i]
        
        # Sort assignments by date
        sorted_assignments = sorted(assignments, key=lambda a: a['date'])
        
        # Export assignments
        for assignment in sorted_assignments:
            date_str = assignment['date']
            schedule_id = assignment['scheduleId']
            description = assignment.get('description', '')
            
            # Handle "No Bell" system schedule
            if schedule_id == 'system-no-bell':
                lines.append(f"{date_str}   {description if description else 'No Bells'}")
            else:
                schedule_code = schedule_codes.get(schedule_id, 'X')
                lines.append(f"{date_str} {schedule_code}  {description}")
        
        content = '\n'.join(lines)
        
        # Return as plain text (like reading from a URL)
        return Response(content, mimetype='text/plain')
        
    except Exception as e:
        print(f"Error generating ringdates: {e}")
        return Response(f"# Error: {str(e)}", mimetype='text/plain'), 500


# Initialize with default data if needed
def init_data_files():
    """Initialize JSON data files with defaults if they don't exist"""
    
    if not os.path.exists(SCHEDULES_FILE):
        schedules = [
            {
                "id": "1",
                "name": "Normal Schedule",
                "mode": "Normal",
                "isDefault": True,
                "color": DEFAULT_COLORS["Normal"],
                "bellSoundId": None,
                "times": [
                    {"time": "09:00", "description": "1st period"},
                    {"time": "10:00", "description": "2nd period"},
                    {"time": "10:30", "description": "Morning break"},
                    {"time": "11:00", "description": "3rd period"},
                    {"time": "12:00", "description": "Lunch break"},
                    {"time": "13:00", "description": "4th period"},
                    {"time": "14:00", "description": "5th period"},
                    {"time": "15:00", "description": "School end"}
                ]
            }
        ]
        
        with open(SCHEDULES_FILE, 'w') as f:
            json.dump(schedules, f, indent=2)
    
    if not os.path.exists(ASSIGNMENTS_FILE):
        with open(ASSIGNMENTS_FILE, 'w') as f:
            json.dump([], f, indent=2)

# Initialize data
init_data_files()

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
        return jsonify({
            'success': True,
            'user': {
                'email': email,
                'name': user['name']
            }
        })
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
        
    session.clear()
    return jsonify({'success': True})

@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'logged_in' in session:
        return jsonify({
            'authenticated': True, 
            'user': {
                'email': session.get('user'),
                'name': session.get('name')
            }
        })
    return jsonify({'authenticated': False}), 401

# ============================================================================
# SCHEDULES API
# ============================================================================

@app.route('/api/schedules', methods=['GET'])
@login_required
def get_schedules():
    schedules = load_schedules()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
@login_required
def create_schedule():
    schedules = load_schedules()
    new_schedule = request.json
    
    if not new_schedule.get('name') or not new_schedule.get('mode'):
        return jsonify({'error': 'Name and mode are required'}), 400
    
    new_schedule['id'] = str(int(datetime.now().timestamp() * 1000))
    
    if 'isDefault' not in new_schedule:
        new_schedule['isDefault'] = False
    
    if 'color' not in new_schedule:
        mode = new_schedule.get('mode', 'Normal')
        new_schedule['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
    
    bell_sound_id = new_schedule.get('bellSoundId')
    if bell_sound_id:
        bell_sounds = load_bell_sounds_meta()
        if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
            return jsonify({'error': 'Invalid bell sound ID'}), 400
        new_schedule['bellSoundId'] = bell_sound_id
    else:
        new_schedule['bellSoundId'] = None
    
    schedules.append(new_schedule)
    
    if save_schedules(schedules):
        print(f"🔔 Schedule updated - Public URLs refreshed automatically!")
        return jsonify(new_schedule), 201
    return jsonify({'error': 'Failed to save schedule'}), 500

@app.route('/api/schedules/<schedule_id>', methods=['PUT'])
@login_required
def update_schedule(schedule_id):
    schedules = load_schedules()
    updated_data = request.json
    
    for i, schedule in enumerate(schedules):
        if schedule['id'] == schedule_id:
            schedules[i] = {**updated_data, 'id': schedule_id}
            
            if 'color' not in schedules[i]:
                mode = schedules[i].get('mode', 'Normal')
                schedules[i]['color'] = DEFAULT_COLORS.get(mode, DEFAULT_COLORS["Normal"])
            
            bell_sound_id = updated_data.get('bellSoundId')
            if bell_sound_id:
                bell_sounds = load_bell_sounds_meta()
                if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
                    return jsonify({'error': 'Invalid bell sound ID'}), 400
                schedules[i]['bellSoundId'] = bell_sound_id
            else:
                schedules[i]['bellSoundId'] = None
            
            if save_schedules(schedules):
                print(f"🔔 Schedule updated - Public URLs refreshed automatically!")
                return jsonify(schedules[i])
            return jsonify({'error': 'Failed to update schedule'}), 500
    
    return jsonify({'error': 'Schedule not found'}), 404

@app.route('/api/schedules/<schedule_id>', methods=['DELETE'])
@login_required
def delete_schedule(schedule_id):
    schedules = load_schedules()
    schedules = [s for s in schedules if s['id'] != schedule_id]
    
    if not save_schedules(schedules):
        return jsonify({'error': 'Failed to delete schedule'}), 500
    
    assignments = load_assignments()
    assignments = [a for a in assignments if a['scheduleId'] != schedule_id]
    save_assignments(assignments)
    
    print(f"🔔 Schedule deleted - Public URLs refreshed automatically!")
    
    return jsonify({'success': True})

# ============================================================================
# ASSIGNMENTS API
# ============================================================================

@app.route('/api/assignments', methods=['GET'])
@login_required
def get_assignments():
    assignments = load_assignments()
    return jsonify(assignments)

@app.route('/api/assignments', methods=['POST'])
@login_required
def create_assignment():
    assignments = load_assignments()
    data = request.json
    dates = data.get('dates', [])
    schedule_id = data.get('scheduleId')
    description = data.get('description', '')
    custom_times = data.get('customTimes')
    bell_sound_id = data.get('bellSoundId')
    
    if not dates or not schedule_id:
        return jsonify({'error': 'Dates and scheduleId are required'}), 400
    
    if bell_sound_id:
        bell_sounds = load_bell_sounds_meta()
        if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
            return jsonify({'error': 'Invalid bell sound ID'}), 400
    
    created_assignments = []
    for date in dates:
        new_assignment = {
            'id': str(int(datetime.now().timestamp() * 1000)) + str(len(assignments)),
            'date': date,
            'scheduleId': schedule_id,
            'description': description
        }
        
        if custom_times:
            new_assignment['customTimes'] = custom_times
        
        if bell_sound_id is not None:
            new_assignment['bellSoundId'] = bell_sound_id
            
        assignments.append(new_assignment)
        created_assignments.append(new_assignment)
    
    if save_assignments(assignments):
        print(f"🔔 Assignment created - Public URLs refreshed automatically!")
        return jsonify({'success': True, 'assignments': created_assignments}), 201
    return jsonify({'error': 'Failed to save assignment'}), 500

@app.route('/api/assignments/<assignment_id>', methods=['PUT'])
@login_required
def update_assignment(assignment_id):
    assignments = load_assignments()
    data = request.json
    
    for i, assignment in enumerate(assignments):
        if assignment['id'] == assignment_id:
            assignments[i] = {
                'id': assignment_id,
                'date': data.get('date', assignment['date']),
                'scheduleId': data.get('scheduleId', assignment['scheduleId']),
                'description': data.get('description', assignment.get('description', ''))
            }
            
            if 'customTimes' in data:
                if data['customTimes'] is not None:
                    assignments[i]['customTimes'] = data['customTimes']
                elif 'customTimes' in assignments[i]:
                    del assignments[i]['customTimes']
            
            if 'bellSoundId' in data:
                bell_sound_id = data['bellSoundId']
                
                if bell_sound_id:
                    bell_sounds = load_bell_sounds_meta()
                    if not any(sound['id'] == bell_sound_id for sound in bell_sounds):
                        return jsonify({'error': 'Invalid bell sound ID'}), 400
                    assignments[i]['bellSoundId'] = bell_sound_id
                else:
                    if 'bellSoundId' in assignments[i]:
                        del assignments[i]['bellSoundId']
            
            if save_assignments(assignments):
                print(f"🔔 Assignment updated - Public URLs refreshed automatically!")
                return jsonify(assignments[i])
            return jsonify({'error': 'Failed to update assignment'}), 500
    
    return jsonify({'error': 'Assignment not found'}), 404

@app.route('/api/assignments/<assignment_id>', methods=['DELETE'])
@login_required
def delete_assignment(assignment_id):
    assignments = load_assignments()
    assignments = [a for a in assignments if a['id'] != assignment_id]
    
    if save_assignments(assignments):
        print(f"🔔 Assignment deleted - Public URLs refreshed automatically!")
        return jsonify({'success': True})
    return jsonify({'error': 'Failed to delete assignment'}), 500

# ============================================================================
# BELL SOUNDS API
# ============================================================================

BELL_SOUNDS_DIR = os.path.join(DATA_DIR, 'bell_sounds')
BELL_SOUNDS_META_FILE = os.path.join(DATA_DIR, 'bell_sounds_meta.json')

os.makedirs(BELL_SOUNDS_DIR, exist_ok=True)

def load_bell_sounds_meta():
    try:
        with open(BELL_SOUNDS_META_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_bell_sounds_meta(meta):
    try:
        with open(BELL_SOUNDS_META_FILE, 'w') as f:
            json.dump(meta, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving bell sounds meta: {e}")
        return False

@app.route('/api/bell-sounds', methods=['GET'])
@login_required
def get_bell_sounds():
    meta = load_bell_sounds_meta()
    return jsonify(meta)

@app.route('/api/bell-sounds', methods=['POST'])
@login_required
def upload_bell_sound():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        allowed_extensions = {'mp3', 'wav', 'ogg', 'm4a', 'aac'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: MP3, WAV, OGG, M4A, AAC'}), 400
        
        timestamp = int(datetime.now().timestamp() * 1000)
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(BELL_SOUNDS_DIR, safe_filename)
        
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        meta = load_bell_sounds_meta()
        new_sound = {
            'id': str(timestamp),
            'name': file.filename.rsplit('.', 1)[0],
            'fileName': file.filename,
            'savedFileName': safe_filename,
            'size': file_size,
            'uploadedAt': datetime.now().isoformat()
        }
        
        meta.append(new_sound)
        save_bell_sounds_meta(meta)
        
        return jsonify(new_sound), 201
        
    except Exception as e:
        print(f"Error uploading bell sound: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['GET'])
@login_required
def get_bell_sound_file(sound_id):
    try:
        meta = load_bell_sounds_meta()
        sound = next((s for s in meta if s['id'] == sound_id), None)
        
        if not sound:
            return jsonify({'error': 'Sound not found'}), 404
        
        file_path = os.path.join(BELL_SOUNDS_DIR, sound['savedFileName'])
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, mimetype='audio/mpeg')
        
    except Exception as e:
        print(f"Error getting bell sound file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['PUT'])
@login_required
def update_bell_sound(sound_id):
    try:
        data = request.json
        meta = load_bell_sounds_meta()
        
        for i, sound in enumerate(meta):
            if sound['id'] == sound_id:
                meta[i]['name'] = data.get('name', sound['name'])
                save_bell_sounds_meta(meta)
                return jsonify(meta[i])
        
        return jsonify({'error': 'Sound not found'}), 404
        
    except Exception as e:
        print(f"Error updating bell sound: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bell-sounds/<sound_id>', methods=['DELETE'])
@login_required
def delete_bell_sound(sound_id):
    try:
        meta = load_bell_sounds_meta()
        sound = next((s for s in meta if s['id'] == sound_id), None)
        
        if not sound:
            return jsonify({'error': 'Sound not found'}), 404
        
        schedules = load_schedules()
        schedules_updated = False
        for schedule in schedules:
            if schedule.get('bellSoundId') == sound_id:
                schedule['bellSoundId'] = None
                schedules_updated = True
        
        if schedules_updated:
            save_schedules(schedules)
        
        assignments = load_assignments()
        assignments_updated = False
        for assignment in assignments:
            if assignment.get('bellSoundId') == sound_id:
                del assignment['bellSoundId']
                assignments_updated = True
        
        if assignments_updated:
            save_assignments(assignments)
        
        file_path = os.path.join(BELL_SOUNDS_DIR, sound['savedFileName'])
        if os.path.exists(file_path):
            os.remove(file_path)
        
        meta = [s for s in meta if s['id'] != sound_id]
        save_bell_sounds_meta(meta)
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error deleting bell sound: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# STATUS ENDPOINT
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok', 
        'message': 'Bell Schedule API is running',
        'public_urls': {
            'ringtimes': f'http://localhost:5001/public/ringtimes',
            'ringdates': f'http://localhost:5001/public/ringdates',
            'info': 'Bash script can read directly from these URLs'
        }
    })

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    
    print()
    print("=" * 70)
    print("🔔 BELL SCHEDULE SYSTEM - Backend API Server")
    print("=" * 70)
    print()
    print("📍 PUBLIC URLs (for bash script to read):")
    print(f"   Ringtimes: http://0.0.0.0:{port}/public/ringtimes")
    print(f"   Ringdates: http://0.0.0.0:{port}/public/ringdates")
    print()
    print("🔗 API Endpoints:")
    print(f"   Health: http://0.0.0.0:{port}/api/health")
    print(f"   Login: http://0.0.0.0:{port}/api/login")
    print()
    print(f"✅ Backend running on port: {port}")
    print("=" * 70)
    print()
    
    app.run(debug=False, host='0.0.0.0', port=port)